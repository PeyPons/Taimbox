import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SupportMessageEditor } from "@/components/support/SupportMessageEditor";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/lib/supabase";
import { toast } from "@/lib/notify";
import { useAgency } from "@/contexts/AgencyContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, MessageCircle, CheckCircle, Eye, Send } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { SupportMessageContent } from "@/components/support/SupportMessageContent";

interface MyTicketRow {
  id: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
}

interface MyTicketReply {
  id: string;
  author_display?: string | null;
  message: string;
  created_at: string;
  is_from_support: boolean;
}

const statusLabel: Record<string, string> = {
  open: "Abierto",
  in_progress: "En curso",
  closed: "Cerrado",
};

export default function ContactSupportPage() {
  const { currentAgency } = useAgency();
  const { user: authUser } = useAuth();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const [myTickets, setMyTickets] = useState<MyTicketRow[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [ticketDetail, setTicketDetail] = useState<MyTicketRow | null>(null);
  const [replies, setReplies] = useState<MyTicketReply[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [messageKey, setMessageKey] = useState(0);
  const [replyKey, setReplyKey] = useState(0);
  const [sendingReply, setSendingReply] = useState(false);

  const fetchMyTickets = useCallback(async () => {
    setLoadingTickets(true);
    try {
      const { data, error } = await supabase.rpc("list_my_support_tickets");
      if (error) throw error;
      setMyTickets((data as MyTicketRow[]) || []);
    } catch (e) {
      console.error("[ContactSupportPage] Error listing tickets:", e);
      toast.error("Error al cargar tus tickets");
      setMyTickets([]);
    } finally {
      setLoadingTickets(false);
    }
  }, []);

  useEffect(() => {
    if (currentAgency?.id) fetchMyTickets();
  }, [currentAgency?.id, fetchMyTickets]);

  useEffect(() => {
    if (!selectedTicketId) {
      setTicketDetail(null);
      setReplies([]);
      return;
    }
    let cancelled = false;
    setLoadingDetail(true);
    (async () => {
      try {
        const [detailRes, repliesRes] = await Promise.all([
          supabase.rpc("get_my_support_ticket", { p_ticket_id: selectedTicketId }),
          supabase.rpc("list_my_support_ticket_replies", { p_ticket_id: selectedTicketId }),
        ]);
        if (cancelled) return;
        if (detailRes.error) throw detailRes.error;
        if (repliesRes.error) throw repliesRes.error;
        const row = (detailRes.data as unknown[])?.[0];
        setTicketDetail(row ? (row as MyTicketRow) : null);
        setReplies((repliesRes.data as MyTicketReply[]) || []);
      } catch (e) {
        if (!cancelled) {
          console.error("[ContactSupportPage] Error loading ticket:", e);
          toast.error("Error al cargar el ticket");
        }
      } finally {
        if (!cancelled) setLoadingDetail(false);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedTicketId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAgency?.id) {
      toast.error("Selecciona una agencia para enviar la solicitud.");
      return;
    }
    if (!subject.trim()) {
      toast.error("El asunto es obligatorio.");
      return;
    }
    if (!message.trim()) {
      toast.error("El mensaje es obligatorio.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.rpc("create_support_ticket_from_app", {
        p_agency_id: currentAgency.id,
        p_subject: subject.trim(),
        p_message: message.trim(),
      });
      if (error) throw error;
      setSent(true);
      setSubject("");
      setMessage("");
      setMessageKey((k) => k + 1);
      toast.success("Solicitud enviada. Te responderemos lo antes posible.");
      fetchMyTickets();
    } catch (e: unknown) {
      console.error("[ContactSupportPage] Error:", e);
      toast.error("Error al enviar la solicitud. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const sendReply = async () => {
    if (!selectedTicketId || !replyText?.trim()) {
      toast.error("Escribe un mensaje");
      return;
    }
    setSendingReply(true);
    try {
      const { error } = await supabase.rpc("add_support_ticket_reply_from_app", {
        p_ticket_id: selectedTicketId,
        p_message: replyText.trim(),
      });
      if (error) throw error;
      toast.success("Respuesta enviada");
      setReplyText("");
      setReplyKey((k) => k + 1);
      const { data } = await supabase.rpc("list_my_support_ticket_replies", {
        p_ticket_id: selectedTicketId,
      });
      setReplies((data as MyTicketReply[]) || []);
    } catch (e: unknown) {
      console.error("[ContactSupportPage] Error sending reply:", e);
      toast.error("Error al enviar la respuesta");
    } finally {
      setSendingReply(false);
    }
  };

  const formatDate = (s: string) => {
    try {
      return new Date(s).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" });
    } catch {
      return s;
    }
  };

  if (!currentAgency) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-slate-600">Selecciona una agencia para contactar con soporte.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Soporte</h1>
        <p className="text-slate-600 mt-1">
          Envía solicitudes y sigue el estado de tus tickets para la agencia{" "}
          <strong>{currentAgency.name}</strong>.
        </p>
      </div>

      {/* Nueva solicitud */}
      {!sent ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageCircle className="h-5 w-5 text-primary" />
              Nueva solicitud
            </CardTitle>
            <CardDescription>
              Describe tu consulta o incidencia. El equipo de soporte te responderá aquí.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Asunto</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Ej: Problema con la sincronización de anuncios"
                  maxLength={200}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Mensaje</Label>
                <SupportMessageEditor
                  key={messageKey}
                  id="message"
                  value={message}
                  onChange={setMessage}
                  placeholder="Describe tu consulta o incidencia con el mayor detalle posible…"
                  minHeight="140px"
                />
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Enviando...
                  </>
                ) : (
                  "Enviar solicitud"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6 flex flex-col items-center text-center gap-4">
            <CheckCircle className="h-12 w-12 text-emerald-500" />
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Solicitud enviada</h2>
              <p className="text-slate-600 mt-1">
                Puedes ver el estado y las respuestas en &quot;Mis tickets&quot;.
              </p>
            </div>
            <Button variant="outline" onClick={() => setSent(false)}>
              Enviar otra solicitud
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Mis tickets */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Mis tickets</CardTitle>
          <CardDescription>
            Listado de tus solicitudes. Haz clic en &quot;Ver&quot; para ver detalle y responder.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingTickets ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : myTickets.length === 0 ? (
            <p className="text-slate-500 text-center py-6">No tienes ningún ticket.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asunto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Creado</TableHead>
                  <TableHead className="w-[80px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {myTickets.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      <span className="font-medium">{t.subject}</span>
                      {t.message && (
                        <p className="text-xs text-slate-500 truncate max-w-[200px]" title={t.message}>
                          {t.message}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          t.status === "closed"
                            ? "secondary"
                            : t.status === "in_progress"
                              ? "default"
                              : "outline"
                        }
                      >
                        {statusLabel[t.status] ?? t.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-500 text-sm">{formatDate(t.created_at)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1"
                        onClick={() => setSelectedTicketId(t.id)}
                      >
                        <Eye className="h-4 w-4" />
                        Ver
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detalle del ticket (Sheet) */}
      <Sheet open={!!selectedTicketId} onOpenChange={(open) => !open && setSelectedTicketId(null)}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Detalle del ticket</SheetTitle>
          </SheetHeader>
          {loadingDetail ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : ticketDetail ? (
            <div className="space-y-6 mt-6">
              <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400 mb-0.5">Asunto</p>
                  <p className="font-medium text-slate-900">{ticketDetail.subject}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400 mb-0.5">Mensaje inicial</p>
                  <SupportMessageContent content={ticketDetail.message} />
                </div>
                <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-200">
                  <Badge
                    variant={
                      ticketDetail.status === "closed"
                        ? "secondary"
                        : ticketDetail.status === "in_progress"
                          ? "default"
                          : "outline"
                    }
                  >
                    {statusLabel[ticketDetail.status] ?? ticketDetail.status}
                  </Badge>
                  <span className="text-xs text-slate-500">Creado {formatDate(ticketDetail.created_at)}</span>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <h3 className="text-sm font-semibold text-slate-800 mb-3">Conversación</h3>
                {replies.length === 0 ? (
                  <p className="text-slate-500 text-sm py-4">Aún no hay respuestas. El equipo de soporte te responderá aquí.</p>
                ) : (
                  <ul className="space-y-4 mb-5">
                    {replies.map((r) => {
                      const isCurrentUser =
                        authUser?.email &&
                        (r.author_display === authUser.email ||
                          r.author_display?.toLowerCase() === authUser.email?.toLowerCase());
                      const displayName = isCurrentUser
                        ? "Tú"
                        : r.author_display || (r.is_from_support ? "Soporte" : "Tú");
                      return (
                        <li
                          key={r.id}
                          className={`flex gap-3 rounded-lg border p-3 text-sm ${
                            r.is_from_support
                              ? "border-primary/25 bg-primary/5"
                              : "border-slate-200 bg-slate-50/80"
                          }`}
                        >
                          <Avatar className="h-8 w-8 shrink-0 border border-slate-200">
                            <AvatarFallback
                              className={
                                r.is_from_support
                                  ? "bg-primary/20 text-primary text-xs"
                                  : "bg-slate-200 text-slate-600 text-xs"
                              }
                            >
                              {displayName[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-slate-800 mb-0.5">{displayName}</p>
                            <p className="text-xs text-slate-500 mb-1.5">{formatDate(r.created_at)}</p>
                            <SupportMessageContent content={r.message} className="text-slate-700 text-sm" />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
                {ticketDetail.status !== "closed" && (
                  <div className="rounded-lg border border-slate-200 bg-white p-3 space-y-3">
                    <SupportMessageEditor
                      key={replyKey}
                      value={replyText}
                      onChange={setReplyText}
                      placeholder="Escribe tu respuesta…"
                      minHeight="100px"
                    />
                    <Button
                      size="sm"
                      onClick={sendReply}
                      disabled={sendingReply || !replyText?.trim()}
                      className="gap-1.5"
                    >
                      {sendingReply ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          Enviar respuesta
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-slate-500 py-8">No se pudo cargar el ticket.</p>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
