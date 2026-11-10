import type { Log } from '../types';
import { ContentViewer } from './ContentViewer';

type Props = { log: Log };

export function LogDetail({ log }: Props) {
  return <section className="card request-response-content" aria-label="Traffic request and response">
    <ContentViewer key={`${log.id}:request`} label="request" content={log.request_json} hint="json" />
    <ContentViewer key={`${log.id}:response`} label="response" content={log.response_json} hint="json" />
    <ContentViewer key={`${log.id}:error`} label="error" content={log.error} hint="plaintext" />
  </section>;
}
