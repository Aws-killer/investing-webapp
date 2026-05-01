import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import {
  Activity,
  BookOpen,
  Building2,
  FileQuestion,
  GraduationCap,
  KeyRound,
  RefreshCw,
  ShieldCheck,
  Users,
} from "lucide-react";
import {
  useCreateAdminFAQMutation,
  useDeleteAdminFAQMutation,
  useCreateCorporateActionMutation,
  useCreateLearningArticleMutation,
  useCreateLearningQuestionMutation,
  useCreateLearningQuizMutation,
  useGetAdminDashboardQuery,
  useGetAdminFAQsQuery,
  useGetAdminFundsQuery,
  useGetAdminUsersQuery,
  useGetCorporateActionsQuery,
  useGetLearningArticlesQuery,
  useGetLearningQuizzesQuery,
  useRefreshFundsMutation,
  useSetTemporaryPasswordMutation,
  useUpdateAdminFAQMutation,
  useUpdateFundInfoMutation,
} from "@/features/api/adminApi";

const tabs = [
  { id: "overview", label: "Overview", icon: Activity },
  { id: "funds", label: "Funds", icon: FileQuestion },
  { id: "stocks", label: "Stocks", icon: Building2 },
  { id: "users", label: "Users", icon: Users },
  { id: "learning", label: "Learning", icon: GraduationCap },
];

const emptyFAQ = { fund_id: "", question: "", answer: "", sort_order: 0 };
const emptyInfo = { objective: "", strategy: "", risk_level: "", suitable_for: "", benchmark: "" };
const emptyAction = { symbol: "", action_type: "Dividend", headline: "", currency: "TZS" };
const emptyArticle = { title: "", slug: "", category: "funds", content: "", status: "draft", difficulty: "beginner" };
const emptyQuiz = { title: "", slug: "", category: "funds", difficulty: "beginner", passing_score: 70, status: "draft" };
const emptyQuestion = {
  quizId: "",
  question_type: "scenario",
  prompt: "",
  scenario: "",
  life_situation: "",
  calculation_notes: "",
  options: [],
  correct_answer: "",
  explanation: "",
  points: 1,
};

const inputClass = "w-full rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-white/30";

function Field({ label, children }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-white/40">{label}</span>
      {children}
    </label>
  );
}

function Panel({ title, icon: Icon, children }) {
  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.025] p-4">
      <div className="mb-4 flex items-center gap-2">
        {Icon && <Icon size={16} className="text-white/40" />}
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Metric({ label, value, icon: Icon }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium capitalize text-white/40">{label.replaceAll("_", " ")}</p>
        {Icon && <Icon size={16} className="text-white/30" />}
      </div>
      <p className="mt-3 text-2xl font-bold">{value ?? 0}</p>
    </div>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const isAdmin = Boolean(isAuthenticated && user?.is_admin);
  const [tab, setTab] = useState("overview");
  const [faq, setFaq] = useState(emptyFAQ);
  const [editingFaqId, setEditingFaqId] = useState(null);
  const [selectedFundId, setSelectedFundId] = useState("");
  const [fundInfo, setFundInfo] = useState(emptyInfo);
  const [action, setAction] = useState(emptyAction);
  const [article, setArticle] = useState(emptyArticle);
  const [quiz, setQuiz] = useState(emptyQuiz);
  const [question, setQuestion] = useState(emptyQuestion);
  const [passwordReset, setPasswordReset] = useState({ userId: "", temporary_password: "" });

  const { data: dashboard = {}, isFetching } = useGetAdminDashboardQuery(undefined, { skip: !isAdmin });
  const { data: adminFunds = [] } = useGetAdminFundsQuery(undefined, { skip: !isAdmin });
  const { data: faqs = [] } = useGetAdminFAQsQuery(undefined, { skip: !isAdmin });
  const { data: users = [] } = useGetAdminUsersQuery(undefined, { skip: !isAdmin });
  const { data: corporateActions = [] } = useGetCorporateActionsQuery(undefined, { skip: !isAdmin });
  const { data: articles = [] } = useGetLearningArticlesQuery(undefined, { skip: !isAdmin });
  const { data: quizzes = [] } = useGetLearningQuizzesQuery(undefined, { skip: !isAdmin });

  const [createFAQ] = useCreateAdminFAQMutation();
  const [updateFAQ] = useUpdateAdminFAQMutation();
  const [deleteFAQ] = useDeleteAdminFAQMutation();
  const [updateFundInfo] = useUpdateFundInfoMutation();
  const [refreshFunds] = useRefreshFundsMutation();
  const [setTemporaryPassword] = useSetTemporaryPasswordMutation();
  const [createCorporateAction] = useCreateCorporateActionMutation();
  const [createArticle] = useCreateLearningArticleMutation();
  const [createQuiz] = useCreateLearningQuizMutation();
  const [createQuestion] = useCreateLearningQuestionMutation();

  const submit = async (event, fn, payload, reset) => {
    event.preventDefault();
    await fn(payload).unwrap();
    reset();
  };

  const selectedFund = useMemo(
    () => adminFunds.find((fund) => String(fund.id) === String(selectedFundId)),
    [adminFunds, selectedFundId],
  );

  const selectedFundFaqs = useMemo(
    () => faqs.filter((item) => String(item.fund_id) === String(selectedFundId)),
    [faqs, selectedFundId],
  );

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    if (user && !user.is_admin) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, router, user]);

  useEffect(() => {
    if (!selectedFund && adminFunds.length) {
      setSelectedFundId(String(adminFunds[0].id));
    }
  }, [adminFunds, selectedFund]);

  useEffect(() => {
    const info = selectedFund?.info ?? {};
    setFundInfo({
      objective: info.objective ?? "",
      strategy: info.strategy ?? "",
      risk_level: info.risk_level ?? "",
      suitable_for: info.suitable_for ?? "",
      benchmark: info.benchmark ?? "",
    });
    setFaq((current) => ({ ...current, fund_id: selectedFund?.id ? String(selectedFund.id) : "" }));
  }, [selectedFund]);

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-sm text-white/50">
        Checking admin access...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <header className="mb-6 flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/30">Uwekezaji</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-xs text-white/50">
            <ShieldCheck size={14} />
            Admin access
            {isFetching && <RefreshCw size={13} className="animate-spin" />}
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
          <aside className="space-y-1">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition ${tab === id ? "bg-white text-black" : "text-white/55 hover:bg-white/5 hover:text-white"}`}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </aside>

          <main className="space-y-6">
            {tab === "overview" && (
              <>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                  <Metric label="users" value={dashboard.users} icon={Users} />
                  <Metric label="fund FAQs" value={dashboard.fund_faqs} icon={FileQuestion} />
                  <Metric label="corporate actions" value={dashboard.corporate_actions} icon={Building2} />
                  <Metric label="learning articles" value={dashboard.learning_articles} icon={BookOpen} />
                  <Metric label="learning quizzes" value={dashboard.learning_quizzes} icon={GraduationCap} />
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                  <Panel title="Quick fund refresh" icon={RefreshCw}>
                    <div className="flex flex-wrap gap-2">
                      {["all", "itrust", "utt", "orbit", "vertex"].map((manager) => (
                        <button key={manager} onClick={() => refreshFunds(manager)} className="rounded-md border border-white/10 px-3 py-2 text-xs text-white/70 hover:bg-white/5">
                          {manager}
                        </button>
                      ))}
                    </div>
                  </Panel>
                  <Panel title="Recent users" icon={Users}>
                    <div className="space-y-2">
                      {users.slice(0, 5).map((user) => (
                        <p key={user.id} className="truncate text-sm text-white/55">{user.email}</p>
                      ))}
                    </div>
                  </Panel>
                  <Panel title="Learning pipeline" icon={GraduationCap}>
                    <p className="text-sm text-white/55">{articles.length} articles and {quizzes.length} graded quizzes prepared.</p>
                  </Panel>
                </div>
              </>
            )}

            {tab === "funds" && (
              <div className="grid gap-4 xl:grid-cols-2">
                <Panel title="Fund information" icon={FileQuestion}>
                  <form
                    className="space-y-3"
                    onSubmit={(e) => submit(e, updateFundInfo, { fundId: Number(selectedFundId), ...fundInfo }, () => {})}
                  >
                    <Field label="Fund">
                      <select className={inputClass} value={selectedFundId} onChange={(e) => setSelectedFundId(e.target.value)}>
                        {adminFunds.map((fund) => (
                          <option key={fund.id} value={fund.id}>{fund.name}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Risk level"><input className={inputClass} value={fundInfo.risk_level} onChange={(e) => setFundInfo({ ...fundInfo, risk_level: e.target.value })} /></Field>
                    <Field label="Benchmark"><input className={inputClass} value={fundInfo.benchmark} onChange={(e) => setFundInfo({ ...fundInfo, benchmark: e.target.value })} /></Field>
                    <Field label="Objective"><textarea rows={4} className={inputClass} value={fundInfo.objective} onChange={(e) => setFundInfo({ ...fundInfo, objective: e.target.value })} /></Field>
                    <Field label="Strategy"><textarea rows={4} className={inputClass} value={fundInfo.strategy} onChange={(e) => setFundInfo({ ...fundInfo, strategy: e.target.value })} /></Field>
                    <Field label="Suitable for"><textarea rows={3} className={inputClass} value={fundInfo.suitable_for} onChange={(e) => setFundInfo({ ...fundInfo, suitable_for: e.target.value })} /></Field>
                    <button className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-black">Save fund info</button>
                  </form>
                </Panel>

                <Panel title={editingFaqId ? "Edit fund FAQ" : "Create fund FAQ"} icon={FileQuestion}>
                  <form
                    className="space-y-3"
                    onSubmit={(e) => {
                      const payload = { ...faq, fund_id: Number(selectedFundId || faq.fund_id) };
                      return submit(
                        e,
                        editingFaqId ? updateFAQ : createFAQ,
                        editingFaqId ? { id: editingFaqId, ...payload } : payload,
                        () => {
                          setFaq({ ...emptyFAQ, fund_id: selectedFundId });
                          setEditingFaqId(null);
                        },
                      );
                    }}
                  >
                    <Field label="Fund">
                      <select
                        className={inputClass}
                        value={selectedFundId}
                        onChange={(e) => {
                          setSelectedFundId(e.target.value);
                          setFaq({ ...faq, fund_id: e.target.value });
                        }}
                      >
                        {adminFunds.map((fund) => (
                          <option key={fund.id} value={fund.id}>{fund.name}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Question"><input className={inputClass} value={faq.question} onChange={(e) => setFaq({ ...faq, question: e.target.value })} /></Field>
                    <Field label="Answer"><textarea rows={4} className={inputClass} value={faq.answer} onChange={(e) => setFaq({ ...faq, answer: e.target.value })} /></Field>
                    <div className="flex gap-2">
                      <button className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-black">{editingFaqId ? "Update FAQ" : "Save FAQ"}</button>
                      {editingFaqId && (
                        <button type="button" onClick={() => { setEditingFaqId(null); setFaq({ ...emptyFAQ, fund_id: selectedFundId }); }} className="rounded-md border border-white/10 px-4 py-2 text-sm text-white/70">
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                </Panel>
                <Panel title={`FAQs for ${selectedFund?.name ?? "selected fund"}`} icon={FileQuestion}>
                  <div className="max-h-[420px] space-y-3 overflow-auto">
                    {selectedFundFaqs.map((item) => (
                      <div key={item.id} className="rounded-md border border-white/10 p-3">
                        <p className="text-xs text-white/35">{item.fund_name || `Fund ${item.fund_id}`}</p>
                        <p className="mt-1 text-sm font-medium">{item.question}</p>
                        <p className="mt-2 line-clamp-2 text-xs text-white/45">{item.answer}</p>
                        <div className="mt-3 flex gap-2">
                          <button
                            onClick={() => {
                              setEditingFaqId(item.id);
                              setFaq({
                                fund_id: String(item.fund_id),
                                question: item.question,
                                answer: item.answer,
                                sort_order: item.sort_order ?? 0,
                              });
                              setSelectedFundId(String(item.fund_id));
                            }}
                            className="rounded-md border border-white/10 px-3 py-1.5 text-xs text-white/70"
                          >
                            Edit
                          </button>
                          <button onClick={() => deleteFAQ(item.id)} className="rounded-md border border-red-400/30 px-3 py-1.5 text-xs text-red-300">
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Panel>
              </div>
            )}

            {tab === "stocks" && (
              <div className="grid gap-4 xl:grid-cols-2">
                <Panel title="Manual corporate action" icon={Building2}>
                  <form className="space-y-3" onSubmit={(e) => submit(e, createCorporateAction, action, () => setAction(emptyAction))}>
                    <Field label="Symbol"><input className={inputClass} value={action.symbol} onChange={(e) => setAction({ ...action, symbol: e.target.value.toUpperCase() })} /></Field>
                    <Field label="Type"><input className={inputClass} value={action.action_type} onChange={(e) => setAction({ ...action, action_type: e.target.value })} /></Field>
                    <Field label="Headline"><textarea rows={4} className={inputClass} value={action.headline} onChange={(e) => setAction({ ...action, headline: e.target.value })} /></Field>
                    <button className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-black">Save action</button>
                  </form>
                </Panel>
                <Panel title="Recorded actions" icon={Building2}>
                  <div className="max-h-[420px] space-y-3 overflow-auto">
                    {corporateActions.slice(0, 30).map((item) => (
                      <div key={item.id} className="rounded-md border border-white/10 p-3">
                        <p className="text-xs text-white/35">{item.symbol} - {item.action_type}</p>
                        <p className="mt-1 text-sm">{item.headline}</p>
                      </div>
                    ))}
                  </div>
                </Panel>
              </div>
            )}

            {tab === "users" && (
              <div className="grid gap-4 xl:grid-cols-2">
                <Panel title="Temporary password reset" icon={KeyRound}>
                  <form className="space-y-3" onSubmit={(e) => submit(e, setTemporaryPassword, { ...passwordReset, must_change_password: true }, () => setPasswordReset({ userId: "", temporary_password: "" }))}>
                    <Field label="User ID"><input className={inputClass} value={passwordReset.userId} onChange={(e) => setPasswordReset({ ...passwordReset, userId: e.target.value })} /></Field>
                    <Field label="Temporary password"><input className={inputClass} value={passwordReset.temporary_password} onChange={(e) => setPasswordReset({ ...passwordReset, temporary_password: e.target.value })} /></Field>
                    <button className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-black">Reset password</button>
                  </form>
                </Panel>
                <Panel title="User directory" icon={Users}>
                  <div className="max-h-[460px] space-y-2 overflow-auto">
                    {users.map((user) => (
                      <div key={user.id} className="rounded-md border border-white/10 p-3">
                        <p className="text-sm font-medium">{user.email}</p>
                        <p className="mt-1 break-all text-xs text-white/35">{user.id}</p>
                      </div>
                    ))}
                  </div>
                </Panel>
              </div>
            )}

            {tab === "learning" && (
              <div className="grid gap-4 xl:grid-cols-3">
                <Panel title="Article" icon={BookOpen}>
                  <form className="space-y-3" onSubmit={(e) => submit(e, createArticle, article, () => setArticle(emptyArticle))}>
                    <Field label="Title"><input className={inputClass} value={article.title} onChange={(e) => setArticle({ ...article, title: e.target.value })} /></Field>
                    <Field label="Slug"><input className={inputClass} value={article.slug} onChange={(e) => setArticle({ ...article, slug: e.target.value })} /></Field>
                    <Field label="Content"><textarea rows={5} className={inputClass} value={article.content} onChange={(e) => setArticle({ ...article, content: e.target.value })} /></Field>
                    <button className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-black">Save article</button>
                  </form>
                </Panel>
                <Panel title="Graded quiz" icon={GraduationCap}>
                  <form className="space-y-3" onSubmit={(e) => submit(e, createQuiz, quiz, () => setQuiz(emptyQuiz))}>
                    <Field label="Title"><input className={inputClass} value={quiz.title} onChange={(e) => setQuiz({ ...quiz, title: e.target.value })} /></Field>
                    <Field label="Slug"><input className={inputClass} value={quiz.slug} onChange={(e) => setQuiz({ ...quiz, slug: e.target.value })} /></Field>
                    <Field label="Passing score"><input className={inputClass} value={quiz.passing_score} onChange={(e) => setQuiz({ ...quiz, passing_score: Number(e.target.value) })} /></Field>
                    <button className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-black">Save quiz</button>
                  </form>
                </Panel>
                <Panel title="Scenario question" icon={FileQuestion}>
                  <form className="space-y-3" onSubmit={(e) => submit(e, createQuestion, question, () => setQuestion(emptyQuestion))}>
                    <Field label="Quiz ID"><input className={inputClass} value={question.quizId} onChange={(e) => setQuestion({ ...question, quizId: e.target.value })} /></Field>
                    <Field label="Life situation"><textarea rows={2} className={inputClass} value={question.life_situation} onChange={(e) => setQuestion({ ...question, life_situation: e.target.value })} /></Field>
                    <Field label="Scenario"><textarea rows={3} className={inputClass} value={question.scenario} onChange={(e) => setQuestion({ ...question, scenario: e.target.value })} /></Field>
                    <Field label="Prompt"><textarea rows={3} className={inputClass} value={question.prompt} onChange={(e) => setQuestion({ ...question, prompt: e.target.value })} /></Field>
                    <Field label="Calculation notes"><textarea rows={2} className={inputClass} value={question.calculation_notes} onChange={(e) => setQuestion({ ...question, calculation_notes: e.target.value })} /></Field>
                    <button className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-black">Save question</button>
                  </form>
                </Panel>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
