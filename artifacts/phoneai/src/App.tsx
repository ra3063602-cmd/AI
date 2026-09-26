import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import {
  ArrowUpRight,
  AudioLines,
  Bot,
  Check,
  CircleStop,
  CircleAlert,
  Mic,
  PanelLeft,
  Plus,
  Send,
  Sparkles,
  UserRound,
} from 'lucide-react';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

const queryClient = new QueryClient();

function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const endOfConversationRef = useRef<HTMLDivElement>(null);
  const listeningTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    endOfConversationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages, isTyping]);

  useEffect(() => {
    return () => {
      if (listeningTimeoutRef.current) {
        clearTimeout(listeningTimeoutRef.current);
      }
    };
  }, []);

  const sendMessage = async (value: string) => {
    const cleanValue = value.trim();
    if (!cleanValue || isTyping) return;

    const messageId = `user-${Date.now()}`;
    const userMessage: Message = {
      id: messageId,
      role: 'user',
      text: cleanValue,
      time: 'now',
    };
    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setDraft('');
    setIsTyping(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: nextMessages.map(({ role, text }) => ({
            role,
            content: text,
          })),
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | {
            message?: { content?: string };
            command?: { type?: string; url?: string };
            error?: string;
          }
        | null;

      if (!response.ok) {
        throw new Error(
          payload?.error ?? 'The AI service could not complete that message.',
        );
      }

      const assistantText = payload?.message?.content?.trim();
      if (!assistantText) {
        throw new Error('The AI service returned an empty response.');
      }

      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          text: assistantText,
          time: 'now',
        },
      ]);

      if (
        payload?.command?.type === 'open_url' &&
        payload.command.url
      ) {
        const openedWindow = window.open(
          payload.command.url,
          '_blank',
          'noopener,noreferrer',
        );
        if (!openedWindow) {
          window.location.assign(payload.command.url);
        }
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Something went wrong while contacting the AI service.',
      );
    } finally {
      setIsTyping(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    sendMessage(draft);
  };

  const toggleListening = () => {
    if (listeningTimeoutRef.current) {
      clearTimeout(listeningTimeoutRef.current);
      listeningTimeoutRef.current = null;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    setIsListening(true);
    listeningTimeoutRef.current = setTimeout(() => {
      setIsListening(false);
      setDraft('I’m ready to talk through it.');
    }, 2600);
  };

  const startNewConversation = () => {
    setMessages([]);
    setDraft('');
    setIsTyping(false);
    setErrorMessage(null);
    setIsPanelOpen(false);
  };

  return (
    <div className="phoneai-noise min-h-[100dvh] bg-background text-foreground">
      <div className="mx-auto grid min-h-[100dvh] max-w-[1180px] grid-cols-1 gap-0 lg:grid-cols-[220px_minmax(0,780px)] lg:gap-10 lg:px-8 lg:py-8">
        <aside className={`${isPanelOpen ? 'flex' : 'hidden'} fixed inset-0 z-30 flex-col bg-sidebar px-7 py-8 text-sidebar-foreground lg:static lg:flex lg:min-h-[calc(100dvh-4rem)] lg:rounded-[2rem] lg:px-6 lg:py-7`}>
          <div className="flex items-center justify-between lg:block">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-[13px] bg-accent text-accent-foreground shadow-[0_8px_24px_hsl(var(--accent)/.25)]">
                <AudioLines size={20} strokeWidth={2.25} />
              </div>
              <div>
                <p className="font-semibold tracking-[-0.02em]">PhoneAI</p>
                <p className="text-[11px] text-sidebar-foreground/60">a quiet place to think</p>
              </div>
            </div>
            <button
              type="button"
              className="rounded-full p-2 text-sidebar-foreground/70 transition hover:bg-sidebar-accent hover:text-sidebar-foreground lg:hidden"
              onClick={() => setIsPanelOpen(false)}
              aria-label="Close menu"
              data-testid="button-close-menu"
            >
              <PanelLeft size={19} />
            </button>
          </div>

          <div className="mt-14 hidden lg:block">
            <p className="font-serif text-[2.7rem] leading-[0.96] tracking-[-0.045em]">
              Keep a little<br />
              room for<br />
              <span className="text-accent">thought.</span>
            </p>
            <p className="mt-5 max-w-[170px] text-sm leading-6 text-sidebar-foreground/60">
              A small, private-feeling corner for the things you want to untangle.
            </p>
          </div>

          <div className="mt-auto hidden lg:block">
            <div className="rounded-2xl border border-sidebar-border bg-sidebar-accent/60 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold">
                <span className="size-2 rounded-full bg-[#9bd8a9]" />
                Ready when you are
              </div>
              <p className="mt-2 text-[11px] leading-5 text-sidebar-foreground/55">
                Your messages are sent securely to the AI service for a response.
              </p>
            </div>
            <p className="mt-5 text-[10px] uppercase tracking-[0.18em] text-sidebar-foreground/35">
              AI chat · v0.2
            </p>
          </div>
        </aside>

        <main className="relative flex min-h-[100dvh] flex-col overflow-hidden lg:min-h-0 lg:rounded-[2rem] lg:border lg:border-card-border lg:bg-card/55 lg:shadow-[0_20px_70px_hsl(var(--primary)/.08)]">
          <header className="flex h-[74px] shrink-0 items-center justify-between border-b border-border/70 px-5 sm:px-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="mr-1 rounded-full p-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground lg:hidden"
                onClick={() => setIsPanelOpen(true)}
                aria-label="Open menu"
                data-testid="button-open-menu"
              >
                <PanelLeft size={19} />
              </button>
              <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[0_5px_15px_hsl(var(--primary)/.18)]">
                <AudioLines size={17} strokeWidth={2.4} />
              </div>
              <div>
                <p className="text-sm font-semibold tracking-[-0.02em]">PhoneAI</p>
                <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span className="size-1.5 rounded-full bg-[#69b979]" />
                  Personal assistant
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={startNewConversation}
              className="group flex items-center gap-2 rounded-full border border-border bg-background/70 px-3 py-2 text-xs font-semibold text-muted-foreground transition hover:border-primary/30 hover:bg-secondary hover:text-primary"
              data-testid="button-new-conversation"
            >
              <Plus size={15} className="transition-transform group-hover:rotate-90" />
              <span className="hidden sm:inline">New thought</span>
              <span className="sm:hidden">New</span>
            </button>
          </header>

          <section className="flex min-h-0 flex-1 flex-col">
            <div className="flex-1 overflow-y-auto px-5 pb-8 pt-9 sm:px-10 sm:pt-12">
              <div className="mx-auto max-w-[680px]">
                <div className="mb-10 flex items-end justify-between gap-4">
                  <div>
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.19em] text-accent">
                      Today, just now
                    </p>
                    <h1 className="font-serif text-[2.6rem] leading-[0.98] tracking-[-0.045em] text-foreground sm:text-[3.3rem]">
                      What’s on your<br className="hidden sm:block" /> mind?
                    </h1>
                  </div>
                  <div className="gentle-float hidden size-14 shrink-0 items-center justify-center rounded-[19px] border border-accent/20 bg-accent/10 text-accent sm:flex">
                    <Sparkles size={23} strokeWidth={1.7} />
                  </div>
                </div>

                <div className="space-y-6" aria-live="polite">
                  {messages.map((message) => (
                    <MessageBubble key={message.id} message={message} />
                  ))}
                  {isTyping && (
                    <div className="message-in flex items-start gap-3" data-testid="status-typing">
                      <AssistantMark />
                      <div className="rounded-[4px_18px_18px_18px] border border-border bg-card px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="typing-dot size-1.5 rounded-full bg-muted-foreground" />
                          <span className="typing-dot size-1.5 rounded-full bg-muted-foreground" />
                          <span className="typing-dot size-1.5 rounded-full bg-muted-foreground" />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={endOfConversationRef} />
                </div>

                {errorMessage && (
                  <div
                    className="mt-6 flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                    role="alert"
                    data-testid="status-error"
                  >
                    <CircleAlert size={18} className="mt-0.5 shrink-0" />
                    <p>{errorMessage}</p>
                  </div>
                )}

                {messages.length === 0 && !isTyping && !errorMessage && (
                  <div className="mt-10 grid gap-2 sm:grid-cols-2" data-testid="list-starter-prompts">
                    {starterPrompts.map((prompt) => (
                      <button
                        type="button"
                        key={prompt.label}
                        className="group flex items-center justify-between rounded-2xl border border-border/80 bg-card/70 px-4 py-3.5 text-left text-sm text-muted-foreground transition hover:-translate-y-0.5 hover:border-accent/40 hover:bg-accent/5 hover:text-foreground"
                        onClick={() => sendMessage(prompt.text)}
                        data-testid={`button-starter-${prompt.label.toLowerCase().replaceAll(' ', '-')}`}
                      >
                        <span>{prompt.label}</span>
                        <ArrowUpRight size={16} className="text-muted-foreground/50 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="shrink-0 border-t border-border/70 bg-card/30 px-5 pb-[max(1.1rem,env(safe-area-inset-bottom))] pt-4 sm:px-10 sm:pb-7">
              <form onSubmit={handleSubmit} className="mx-auto max-w-[680px]">
                <div className={`relative flex items-end gap-2 rounded-[22px] border bg-card p-2 shadow-[0_8px_30px_hsl(var(--primary)/.06)] transition duration-300 ${isListening ? 'border-accent shadow-[0_8px_30px_hsl(var(--accent)/.13)]' : 'border-border focus-within:border-primary/45 focus-within:shadow-[0_8px_30px_hsl(var(--primary)/.11)]'}`}>
                  <div className="min-w-0 flex-1">
                    <label htmlFor="message-input" className="sr-only">Write a message</label>
                    <input
                      id="message-input"
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      placeholder={isListening ? 'Listening…' : 'Write what’s on your mind'}
                      disabled={isTyping}
                      className="h-11 w-full bg-transparent px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/65 disabled:cursor-wait"
                      data-testid="input-message"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={toggleListening}
                    className={`relative flex size-11 shrink-0 items-center justify-center rounded-[15px] transition ${isListening ? 'listening-pulse bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-secondary hover:text-primary'}`}
                    aria-label={isListening ? 'Stop listening' : 'Start listening'}
                    aria-pressed={isListening}
                    data-testid="button-microphone"
                  >
                    {isListening ? <CircleStop size={19} /> : <Mic size={19} />}
                  </button>
                  <button
                    type="submit"
                    disabled={!draft.trim() || isTyping}
                    className="flex size-11 shrink-0 items-center justify-center rounded-[15px] bg-primary text-primary-foreground transition hover:-translate-y-0.5 hover:bg-primary/90 active:translate-y-0 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
                    aria-label="Send message"
                    data-testid="button-send-message"
                  >
                    <Send size={18} className="translate-x-[-1px] translate-y-[1px]" />
                  </button>
                </div>
                <p className="mt-3 text-center text-[10px] tracking-[0.03em] text-muted-foreground/65">
                  PhoneAI sends messages securely to the AI service
                </p>
              </form>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

type Message = {
  id: string;
  role: 'assistant' | 'user';
  text: string;
  time: string;
};

const starterPrompts = [
  { label: 'Plan my morning', text: 'Can you help me plan a calm morning?' },
  { label: 'Untangle a thought', text: 'I have a thought I can’t quite untangle.' },
  { label: 'Make a small decision', text: 'Help me make a small decision.' },
  { label: 'Give me a reset', text: 'I need a gentle reset.' },
];

function AssistantMark() {
  return (
    <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-[11px] bg-primary text-primary-foreground shadow-[0_5px_14px_hsl(var(--primary)/.16)]">
      <Bot size={16} strokeWidth={2.1} />
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  return (
    <div className={`message-in flex items-start gap-3 ${isUser ? 'justify-end' : ''}`} data-testid={`message-${message.id}`}>
      {!isUser && <AssistantMark />}
      <div className={`max-w-[82%] sm:max-w-[72%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        <div className={`px-4 py-3.5 text-[14px] leading-6 ${isUser ? 'rounded-[18px_4px_18px_18px] bg-primary text-primary-foreground' : 'rounded-[4px_18px_18px_18px] border border-border bg-card text-foreground'}`}>
          {message.text}
        </div>
        <div className={`mt-1.5 flex items-center gap-1.5 px-1 text-[10px] text-muted-foreground/60 ${isUser ? 'flex-row-reverse' : ''}`}>
          {isUser && <UserRound size={11} />}
          <span>{message.time}</span>
          {isUser && <Check size={11} />}
        </div>
      </div>
      {isUser && <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-[11px] border border-accent/20 bg-accent/10 text-accent"><UserRound size={16} /></div>}
    </div>
  );
}

function Router() {
  return (
    // Keep a shared shell (sidebar, navbar) outside the boundary so it
    // survives a page crash.
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
