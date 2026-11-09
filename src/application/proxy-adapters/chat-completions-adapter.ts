import { ProxyAdapter } from './proxy-adapter.js';

export class ChatCompletionsAdapter extends ProxyAdapter {
  readonly apiPath = '/chat/completions' as const;
  readonly apiKind = 'chat_completions' as const;

  isComplete(response: string) {
    return response.includes('data: [DONE]');
  }
}
