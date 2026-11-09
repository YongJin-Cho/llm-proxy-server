import { randomUUID } from 'node:crypto';
import type { TurnSemantic } from '../application/proxy-adapters/proxy-adapter.js';

export type TurnStatus = 'in_progress' | 'completed';
export type TurnFallbackReason = 'missing_tool_identity' | 'unmatched_tool_identity' | 'ambiguous_tool_identity';

export type TurnTrafficStart = {
  turnId: string;
  sequence: number;
  fallbackReason: TurnFallbackReason | null;
};

export type TurnTrafficFinish = {
  turnId: string;
  sequence: number;
  status: TurnStatus;
  toolCallIds: string[];
};

export type TurnRecord = {
  id: string;
  status: TurnStatus;
  startedAt: string;
  finishedAt: string | null;
  trafficCount: number;
};

export interface TurnStore {
  createTurn(turn: { id: string; startedAt: string; status: TurnStatus }): void;
  updateTurn(turn: { id: string; status: TurnStatus; finishedAt: string | null }): void;
  attachTraffic(traffic: { trafficId: string; turnId: string; sequence: number; fallbackReason: TurnFallbackReason | null }): void;
}

type OpenTurn = { id: string; unresolvedToolIds: Set<string>; nextSequence: number };

export class TurnGroupingService {
  private readonly openTurns = new Map<string, OpenTurn>();
  private readonly completedTurns = new Set<string>();
  private sequence = 0;

  constructor(private readonly store: TurnStore) {}

  startTraffic(input: { trafficId: string; semantic: TurnSemantic; request: unknown; now: string }): TurnTrafficStart {
    const toolIds = input.semantic.requestToolResultIds(input.request);
    const continuation = input.semantic.hasToolContinuation(input.request);
    let turn: OpenTurn | undefined;
    let fallbackReason: TurnFallbackReason | null = null;

    if (continuation && toolIds.length === 0) {
      fallbackReason = 'missing_tool_identity';
    } else if (toolIds.length > 0) {
      const matches = [...this.openTurns.values()].filter((candidate) => toolIds.some((id) => candidate.unresolvedToolIds.has(id)));
      if (matches.length === 1) turn = matches[0];
      else fallbackReason = matches.length === 0 ? 'unmatched_tool_identity' : 'ambiguous_tool_identity';
    }

    if (!turn) {
      const id = randomUUID();
      turn = { id, unresolvedToolIds: new Set(), nextSequence: 0 };
      this.openTurns.set(id, turn);
      this.store.createTurn({ id, startedAt: input.now, status: 'in_progress' });
    }

    const sequence = ++this.sequence;
    turn.nextSequence = sequence;
    this.store.attachTraffic({ trafficId: input.trafficId, turnId: turn.id, sequence, fallbackReason });
    return { turnId: turn.id, sequence, fallbackReason };
  }

  finishTraffic(input: { turnId: string; semantic: TurnSemantic; response: unknown; finishedAt: string; succeeded?: boolean }): TurnTrafficFinish {
    const turn = this.openTurns.get(input.turnId);
    if (!turn) throw new Error(`turn ${input.turnId} is not open`);
    const toolCallIds = input.semantic.responseToolCallIds(input.response);
    turn.unresolvedToolIds = new Set(toolCallIds);
    const status: TurnStatus = input.succeeded === false || toolCallIds.length > 0 ? 'in_progress' : 'completed';
    if (status === 'completed') {
      this.openTurns.delete(turn.id);
      this.completedTurns.add(turn.id);
    }
    this.store.updateTurn({ id: turn.id, status, finishedAt: status === 'completed' ? input.finishedAt : null });
    return { turnId: turn.id, sequence: turn.nextSequence, status, toolCallIds };
  }
}
