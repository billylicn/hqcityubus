import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(here, '..');

const headerPattern = /^\s*\d+[.．、]\s*(.+?)\s*$/;
const stopPattern = /^\s*(\d{1,2}):(\d{2})\s+(.+?)\s*$/;
const boardingPattern = /【上车】/;
const alightingPattern = /【下车】/;
const cityUniversityPattern = /新濠锋|澳门城市大学|澳城大/;
const validDirections = new Set(['toHengqin', 'toUniversity']);

export function normalizeStopName(rawName) {
  return cityUniversityPattern.test(rawName) ? '澳门城市大学' : rawName;
}

function stripRoleMarker(name) {
  return name.replace(/【(?:上车|下车)】/g, '').trim();
}

function parseRouteCode(serviceName) {
  return serviceName.match(/^([A-Za-z]+\d+)/)?.[1]?.toUpperCase() ?? serviceName;
}

function toMinutes(hours, minutes) {
  return Number(hours) * 60 + Number(minutes);
}

function validateServiceDays(serviceDays, context) {
  if (
    !Array.isArray(serviceDays) ||
    serviceDays.length === 0 ||
    serviceDays.some((day) => !Number.isInteger(day) || day < 0 || day > 6)
  ) {
    throw new Error(`${context} 的 serviceDays 必须是 0–6 的非空整数数组。`);
  }
  return [...new Set(serviceDays)].sort((a, b) => a - b);
}

export function parseSource(text, source, routeOverrides = []) {
  const routes = [];
  const warnings = [];
  let current = null;

  const commit = () => {
    if (!current) return;
    const boardingStops = current.stops.filter((stop) => stop.role === 'boarding');
    const alightingStops = current.stops.filter((stop) => stop.role === 'alighting');
    const boardingIndex = current.stops.findIndex((stop) => stop.role === 'boarding');
    const alightingIndex = current.stops.findIndex((stop) => stop.role === 'alighting');

    if (boardingStops.length !== 1 || alightingStops.length !== 1) {
      warnings.push({
        serviceName: current.serviceName,
        message: '上车或下车标记缺失/重复，已忽略该线路。',
      });
      current = null;
      return;
    }
    if (boardingIndex >= alightingIndex) {
      warnings.push({
        serviceName: current.serviceName,
        message: '下车站未晚于上车站，已忽略该线路。',
      });
      current = null;
      return;
    }

    const boardingStop = current.stops[boardingIndex];
    const alightingStop = current.stops[alightingIndex];
    const override = routeOverrides.find((item) =>
      item.direction === source.direction && item.serviceName === current.serviceName,
    );
    const serviceDays = validateServiceDays(
      override?.serviceDays ?? source.serviceDays ?? [0, 1, 2, 3, 4, 5, 6],
      current.serviceName,
    );
    const validDates = override?.validDates ?? null;

    routes.push({
      routeCode: parseRouteCode(current.serviceName),
      serviceName: current.serviceName,
      direction: source.direction,
      serviceDays,
      validDates,
      serviceRuleSource: override ? 'data/overrides.json' : `data/${source.file ?? 'source'}`,
      stops: current.stops,
      boardingStopIndex: boardingIndex,
      alightingStopIndex: alightingIndex,
      boardingTime: boardingStop.time,
      alightingTime: alightingStop.time,
      boardingMinutes: boardingStop.minutes,
      alightingMinutes: alightingStop.minutes,
      duration: alightingStop.minutes - boardingStop.minutes,
    });
    current = null;
  };

  for (const [index, rawLine] of text.replace(/^\uFEFF/, '').split(/\r?\n/).entries()) {
    const line = rawLine.trim();
    if (!line) continue;

    const header = line.match(headerPattern);
    if (header) {
      commit();
      current = { serviceName: header[1], stops: [] };
      continue;
    }

    const stop = line.match(stopPattern);
    if (stop && current) {
      const hours = Number(stop[1]);
      const minuteValue = Number(stop[2]);
      if (hours > 23 || minuteValue > 59) {
        warnings.push({
          line: index + 1,
          content: line,
          message: '站点时间超出 00:00–23:59，已忽略该行。',
        });
        continue;
      }
      const rawNameWithMarker = stop[3];
      const rawName = stripRoleMarker(rawNameWithMarker);
      const baseMinutes = toMinutes(stop[1], stop[2]);
      const previousMinutes = current.stops.at(-1)?.minutes;
      let minutes = baseMinutes;
      while (previousMinutes != null && minutes < previousMinutes) minutes += 24 * 60;
      const role = boardingPattern.test(rawNameWithMarker)
        ? 'boarding'
        : alightingPattern.test(rawNameWithMarker)
          ? 'alighting'
          : null;

      current.stops.push({
        rawName,
        displayName: normalizeStopName(rawName),
        time: `${stop[1].padStart(2, '0')}:${stop[2]}`,
        minutes,
        dayOffset: Math.floor(minutes / (24 * 60)),
        role,
      });
      continue;
    }

    warnings.push({
      line: index + 1,
      content: line,
      message: current ? '无法识别的站点行，已忽略。' : '无法识别且不属于任何线路，已忽略。',
    });
  }
  commit();

  return { routes, warnings };
}

async function loadJson(relativePath) {
  return JSON.parse(await readFile(resolve(projectRoot, relativePath), 'utf8'));
}

async function main() {
  const config = await loadJson('data/config.json');
  const overrides = await loadJson('data/overrides.json');
  const routes = [];
  const warnings = [];

  if (!Array.isArray(config.sources) || config.sources.length === 0) {
    throw new Error('data/config.json 至少需要一个 sources 项。');
  }

  for (const source of config.sources) {
    if (!validDirections.has(source.direction)) {
      throw new Error(`不支持的 direction：${source.direction}`);
    }
    validateServiceDays(source.serviceDays, source.file);
    const text = await readFile(resolve(projectRoot, 'data', source.file), 'utf8');
    const parsed = parseSource(text, source, overrides);
    routes.push(...parsed.routes);
    warnings.push(...parsed.warnings.map((warning) => ({ source: source.label, ...warning })));
  }

  const unmatchedOverrides = overrides.filter((override) => !routes.some((route) =>
    route.direction === override.direction && route.serviceName === override.serviceName,
  ));
  for (const override of unmatchedOverrides) {
    warnings.push({
      source: 'data/overrides.json',
      serviceName: override.serviceName,
      message: '覆盖项未匹配到线路，请检查 direction 和 serviceName。',
    });
  }

  routes.sort((a, b) =>
    a.direction.localeCompare(b.direction) || a.boardingMinutes - b.boardingMinutes,
  );

  const payload = {
    schemaVersion: config.schemaVersion ?? 1,
    generatedFrom: [
      'data/config.json',
      'data/overrides.json',
      ...config.sources.map((source) => `data/${source.file}`),
    ],
    serviceAssumption: config.serviceAssumption,
    warnings,
    routes,
  };

  const output = resolve(projectRoot, 'src/data/routes.generated.json');
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  process.stdout.write(`Parsed ${routes.length} routes with ${warnings.length} warning(s).\n`);

  if (warnings.length > 0) process.exitCode = 1;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`${error.stack ?? error}\n`);
    process.exitCode = 1;
  });
}
