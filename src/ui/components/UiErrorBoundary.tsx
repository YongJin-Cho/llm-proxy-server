import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = { children: ReactNode };
type State = { error?: Error };

export class UiErrorBoundary extends Component<Props, State> {
  state: State = {};

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('UI rendering failed', error, info.componentStack);
  }

  private retry = () => {
    this.setState({ error: undefined });
    window.location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;

    return <main className="ui-error card" role="alert">
      <h1>화면을 표시할 수 없습니다</h1>
      <p>UI 처리 중 오류가 발생했습니다. 서버 상태를 확인한 뒤 다시 시도해 주세요.</p>
      <pre>{this.state.error.message}</pre>
      <button type="button" onClick={this.retry}>다시 시도</button>
    </main>;
  }
}
