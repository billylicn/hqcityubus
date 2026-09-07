import { serviceAssumption } from '../data/routes';

export function ServiceNote() {
  return <p className="service-note">运营说明：{serviceAssumption}</p>;
}
