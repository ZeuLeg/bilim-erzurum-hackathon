'use client';

import { useMemo, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { parseConflictReportFromText, type ConflictAlertDTO } from '@/lib/ai/conflictParser';

type MessagePart = {
  type: string;
  text?: string;
};

type AgentMessage = {
  role: 'user' | 'assistant' | 'system' | 'tool' | 'data';
  content?: string;
  parts?: MessagePart[];
};

interface ConflictPanelProps {
  messages: AgentMessage[];
  isLoading: boolean;
  chatError?: Error;
  onRescheduleSuccess?: () => void;
}

type ActionStatus = {
  pendingKey: string | null;
  message: string | null;
  error: string | null;
};

function getMessageText(message: AgentMessage) {
  if (Array.isArray(message.parts)) {
    return message.parts
      .filter((part): part is MessagePart & { text: string } => part.type === 'text' && typeof part.text === 'string')
      .map((part) => part.text)
      .join('');
  }

  return typeof message.content === 'string' ? message.content : '';
}

function formatMessageContent(content: string): string {
  return content;
}

function formatDateLabel(date?: string) {
  if (!date) return 'Tarih bilinmiyor';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' });
}

function formatWorkOrderLine(order: { departmentName: string; plannedStartDate?: string; plannedEndDate?: string }) {
  return `${order.departmentName} — ${formatDateLabel(order.plannedStartDate)} – ${formatDateLabel(order.plannedEndDate)}`;
}

function getRoleLabel(role: AgentMessage['role']): string {
  switch (role) {
    case 'assistant':
      return 'AI Yanıtı';
    case 'user':
      return 'Admin İsteği';
    case 'system':
      return 'Sistem';
    case 'tool':
      return 'Araç';
    default:
      return 'Mesaj';
  }
}

export default function ConflictPanel({ messages, isLoading, chatError, onRescheduleSuccess }: ConflictPanelProps) {
  const [actionStatus, setActionStatus] = useState<ActionStatus>({
    pendingKey: null,
    message: null,
    error: null,
  });

  const assistantMessages = useMemo(
    () => messages.filter((message) => message.role === 'assistant'),
    [messages],
  );

  const handleReschedule = async (
    conflict: ConflictAlertDTO,
    key: string,
  ) => {
    if (!conflict.workOrderId || !conflict.newStart || !conflict.newEnd) return;

    setActionStatus({ pendingKey: key, message: null, error: null });

    try {
      const response = await fetch(`/api/work-orders/${conflict.workOrderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plannedStartDate: conflict.newStart,
          plannedEndDate: conflict.newEnd,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Yeniden planlama başarısız oldu.');
      }

      setActionStatus({
        pendingKey: null,
        message: 'Yeniden planlama başarıyla uygulandı.',
        error: null,
      });
      onRescheduleSuccess?.();
    } catch (error) {
      setActionStatus({
        pendingKey: null,
        message: null,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border-4 border-slate-200 border-t-slate-900 animate-spin" />
        <p className="text-sm font-semibold text-slate-900">AI analiz ediyor...</p>
        <p className="mt-2 text-sm text-slate-500">Conflict detection için iş emirlerini ve konum verilerini inceliyor.</p>
      </div>
    );
  }

  if (chatError) {
    return (
      <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-center text-sm text-amber-900">
        <p className="font-semibold">AI ile iletişimde bir sorun oluştu.</p>
        <p className="mt-2 text-sm">{chatError.message || 'Lütfen sayfayı yenileyin ve tekrar deneyin.'}</p>
      </div>
    );
  }

  if (assistantMessages.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
        <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
          <Sparkles className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900">AI Çakışma Analizi Hazır</h3>
        <p className="mt-2 text-sm text-slate-500">
          Yukarıdaki butona tıklayarak Gemini 2.5 Flash'ın iş emirlerinizi analiz etmesini sağlayın.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {assistantMessages.map((message, index) => {
        const text = getMessageText(message);
        const content = formatMessageContent(text);
        const parsedReport =
          message.role === 'assistant' && text
            ? parseConflictReportFromText(text)
            : null;
        const hasHighConflict = parsedReport?.conflicts.some((conflict) => conflict.severity === 'high');
        const bgClass = hasHighConflict ? 'bg-rose-50 border-rose-200' : 'bg-white border-slate-200';
        const textClass = hasHighConflict ? 'text-rose-900' : 'text-slate-700';

        return (
          <div key={`${message.role}-${index}`} className={`rounded-3xl border p-4 ${bgClass}`}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{getRoleLabel(message.role)}</span>
              {hasHighConflict ? (
                <span className="rounded-full bg-rose-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-700">
                  HIGH severity
                </span>
              ) : null}
            </div>
            {parsedReport ? (
              <div className="space-y-4">
                <p className="text-sm font-semibold text-slate-900">{parsedReport.summary}</p>
                {parsedReport.conflicts.length > 0 ? (
                  <div className="space-y-4">
                    {parsedReport.conflicts.map((conflict, conflictIndex) => (
                      <div
                        key={conflictIndex}
                        className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                          <p className="font-semibold text-slate-900">{conflict.reason}</p>
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                              conflict.severity === 'high'
                                ? 'bg-rose-100 text-rose-700'
                                : conflict.severity === 'medium'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {conflict.severity.toUpperCase()}
                          </span>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <p className="text-sm font-semibold text-slate-800">Work Order A</p>
                            <p className="text-sm text-slate-600">{formatWorkOrderLine(conflict.workOrderA)}</p>
                            {conflict.workOrderA.description ? (
                              <p className="text-sm text-slate-500">{conflict.workOrderA.description}</p>
                            ) : null}
                          </div>
                          <div className="space-y-2">
                            <p className="text-sm font-semibold text-slate-800">Work Order B</p>
                            <p className="text-sm text-slate-600">{formatWorkOrderLine(conflict.workOrderB)}</p>
                            {conflict.workOrderB.description ? (
                              <p className="text-sm text-slate-500">{conflict.workOrderB.description}</p>
                            ) : null}
                          </div>
                        </div>
                        <div className="mt-4 grid gap-3 sm:grid-cols-3">
                          <div>
                            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Mesafe</p>
                            <p className="text-sm font-semibold text-slate-900">{conflict.distanceMeters} m</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Çakışma süresi</p>
                            <p className="text-sm font-semibold text-slate-900">{conflict.overlapDays} gün</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Öneri</p>
                            <p className="text-sm font-semibold text-slate-900">{conflict.reason}</p>
                          </div>
                        </div>
                        {conflict.budgetImpact != null ? (
                          <div className="mt-4 rounded-2xl bg-slate-100 p-3 text-sm text-slate-800">
                            <p className="font-semibold">Tahmini bütçe etkisi</p>
                            <p>{
                              typeof conflict.budgetImpact === 'number'
                                ? `${conflict.budgetImpact.toLocaleString('tr-TR')} TL`
                                : conflict.budgetImpact
                            }</p>
                          </div>
                        ) : null}
                        {conflict.workOrderId && conflict.newStart && conflict.newEnd ? (
                          <div className="mt-4 flex flex-col gap-3">
                            <button
                              type="button"
                              onClick={() => handleReschedule(conflict, `${message.role}-${index}-${conflictIndex}`)}
                              disabled={actionStatus.pendingKey === `${message.role}-${index}-${conflictIndex}`}
                              className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {actionStatus.pendingKey === `${message.role}-${index}-${conflictIndex}`
                                ? 'Yeniden planlanıyor...'
                                : 'Yeniden Planla'}
                            </button>
                            {actionStatus.message && actionStatus.pendingKey === null ? (
                              <p className="text-sm text-emerald-700">{actionStatus.message}</p>
                            ) : null}
                            {actionStatus.error ? (
                              <p className="text-sm text-rose-700">{actionStatus.error}</p>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-600">Çakışma yok. AI sonuç raporu temiz.</p>
                )}
              </div>
            ) : (
              <pre className={`whitespace-pre-wrap break-words text-sm leading-6 ${textClass}`}>{content}</pre>
            )}
          </div>
        );
      })}
    </div>
  );
}
