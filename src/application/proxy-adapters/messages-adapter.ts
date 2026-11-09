import { ProxyAdapter } from './proxy-adapter.js';

export class MessagesAdapter extends ProxyAdapter {
  readonly apiPath = '/messages' as const;
  readonly apiKind = 'messages' as const;

  isComplete(response: string) {
    return response.includes('message_stop');
  }
}
