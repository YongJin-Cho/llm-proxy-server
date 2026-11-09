import { ProxyAdapter } from './proxy-adapter.js';

export class ResponsesAdapter extends ProxyAdapter {
  readonly apiPath = '/responses' as const;
  readonly apiKind = 'responses' as const;

  isComplete(response: string) {
    return response.includes('response.completed') || response.includes('data: [DONE]');
  }
}
