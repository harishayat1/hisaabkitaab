/* ============================================
   HisaabKitaab PWA - app.js
   Complete financial management app
   ============================================ */

/* -------- IndexedDB Manager -------- */
const DB_NAME = "HisaabKitaabDB";
const DB_VERSION = 1;
let db;

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = e => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains("transactions")) {
        const txns = db.createObjectStore("transactions", { keyPath: "id" });
        txns.createIndex("date", "date", { unique: false });
        txns.createIndex("category", "category", { unique: false });
        txns.createIndex("bankSource", "bankSource", { unique: false });
        txns.createIndex("type", "type", { unique: false });
      }
      if (!db.objectStoreNames.contains("budgets")) db.createObjectStore("budgets", { keyPath: "id" });
      if (!db.objectStoreNames.contains("savingsGoals")) db.createObjectStore("savingsGoals", { keyPath: "id" });
      if (!db.objectStoreNames.contains("loans")) db.createObjectStore("loans", { keyPath: "id" });
      if (!db.objectStoreNames.contains("loanRepayments")) db.createObjectStore("loanRepayments", { keyPath: "id" });
      if (!db.objectStoreNames.contains("bankAccounts")) db.createObjectStore("bankAccounts", { keyPath: "id" });
      if (!db.objectStoreNames.contains("importLogs")) db.createObjectStore("importLogs", { keyPath: "id" });
      if (!db.objectStoreNames.contains("settings")) db.createObjectStore("settings", { keyPath: "key" });
    };
    req.onsuccess = e => { db = e.target.result; resolve(db); };
    req.onerror = () => reject(req.error);
  });
}

function dbPut(store, obj) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).put(obj);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function dbGetAll(store) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readonly");
    const req = tx.objectStore(store).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function dbDelete(store, id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function dbClear(store) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function dbGet(store, id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readonly");
    const req = tx.objectStore(store).get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/* -------- Helpers -------- */
function fallbackUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function uid() { try { return crypto.randomUUID(); } catch(e) { return fallbackUID(); } }
function fmtPKR(n, compact) {
  if (compact && Math.abs(n) >= 1000000) return "PKR " + (n/1000000).toFixed(1) + "M";
  if (compact && Math.abs(n) >= 1000) return "PKR " + (n/1000).toFixed(1) + "K";
  return "PKR " + Math.abs(n).toLocaleString("en-PK", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}
function fmtDate(d) { return new Date(d).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" }); }
function fmtDateShort(d) { return new Date(d).toLocaleDateString("en-PK", { day: "numeric", month: "short" }); }
function fmtMonthYear(d) { return new Date(d).toLocaleDateString("en-PK", { month: "long", year: "numeric" }); }
function daysAgo(days) { const d = new Date(); d.setDate(d.getDate() - days); return d; }
function startOfMonth() { const d = new Date(); d.setDate(1); d.setHours(0,0,0,0); return d; }

const CATEGORIES = [
  { key: "food", label: "Food & Dining", icon: "🍽", color: "#FF6B6B" },
  { key: "transport", label: "Transport", icon: "🚗", color: "#4ECDC4" },
  { key: "utilities", label: "Utilities", icon: "⚡", color: "#FFE66D" },
  { key: "shopping", label: "Shopping", icon: "🛍", color: "#A78BFA" },
  { key: "health", label: "Health", icon: "💊", color: "#F472B6" },
  { key: "entertainment", label: "Entertainment", icon: "🎬", color: "#60A5FA" },
  { key: "education", label: "Education", icon: "📚", color: "#34D399" },
  { key: "transfers", label: "Transfers", icon: "↔", color: "#FBBF24" },
  { key: "income", label: "Income", icon: "💰", color: "#00D09E" },
  { key: "mobileTopup", label: "Mobile Top-up", icon: "📱", color: "#FB923C" },
  { key: "billPayment", label: "Bill Payment", icon: "📄", color: "#EAB308" },
  { key: "savings", label: "Savings", icon: "⭐", color: "#FFD700" },
  { key: "other", label: "Other", icon: "❓", color: "#9CA3AF" }
];

const BANKS = [
  { key: "meezanBank", label: "Meezan Bank", color: "#006B3C" },
  { key: "easypaisa", label: "EasyPaisa", color: "#7CB518" },
  { key: "sadapay", label: "SadaPay", color: "#FF6B35" },
  { key: "naypay", label: "NayaPay", color: "#5E60CE" },
  { key: "jazzCash", label: "JazzCash", color: "#ED1C24" },
  { key: "cash", label: "Cash", color: "#8892A4" }
];

function catColor(key) { return (CATEGORIES.find(c => c.key === key) || {}).color || "#9CA3AF"; }
function catIcon(key) { return (CATEGORIES.find(c => c.key === key) || {}).icon || "❓"; }
function catLabel(key) { return (CATEGORIES.find(c => c.key === key) || {}).label || "Other"; }
function bankColor(key) { return (BANKS.find(b => b.key === key) || {}).color || "#8892A4"; }
function bankLabel(key) { return (BANKS.find(b => b.key === key) || {}).label || "Cash"; }

/* -------- Transaction Class -------- */
class Transaction {
  constructor(opts) {
    this.id = opts.id || uid();
    this.date = opts.date || new Date().toISOString();
    this.amount = opts.amount || 0;
    this.type = opts.type || "debit";
    this.description = opts.description || "";
    this.merchant = opts.merchant || "";
    this.category = opts.category || "other";
    this.bankSource = opts.bankSource || "cash";
    this.balance = opts.balance || null;
    this.fee = opts.fee || null;
    this.tags = opts.tags || [];
    this.isRecurring = opts.isRecurring || false;
  }
}

/* -------- Category Classifier -------- */
const MERCHANT_DB = new Map([
  ["foodpanda", "food"], ["food panda", "food"], ["kfc", "food"], ["mcdonald", "food"],
  ["restaurant", "food"], ["cafe", "food"], ["pizza", "food"], ["biryani", "food"],
  ["careem", "transport"], ["uber", "transport"], ["indrive", "transport"], ["bykea", "transport"],
  ["fuel", "transport"], ["petrol", "transport"], ["pso", "transport"],
  ["daraz", "shopping"], ["amazon", "shopping"], ["mart", "shopping"], ["shop", "shopping"],
  ["electric", "utilities"], ["lesco", "utilities"], ["k-electric", "utilities"], ["ssgc", "utilities"],
  ["ptcl", "utilities"], ["gas", "utilities"], ["bill", "billPayment"],
  ["jazz", "mobileTopup"], ["zong", "mobileTopup"], ["telenor", "mobileTopup"], ["ufone", "mobileTopup"],
  ["recharge", "mobileTopup"], ["mobile load", "mobileTopup"], ["topup", "mobileTopup"],
  ["hospital", "health"], ["doctor", "health"], ["pharmacy", "health"], ["medical", "health"],
  ["netflix", "entertainment"], ["youtube", "entertainment"], ["cinema", "entertainment"], ["spotify", "entertainment"],
  ["school", "education"], ["university", "education"], ["course", "education"], ["book", "education"],
  ["transfer", "transfers"], ["send money", "transfers"],
  ["salary", "income"], ["cashback", "income"], ["refund", "income"],
  ["saving", "savings"], ["investment", "savings"]
]);

function classifyTransaction(txn) {
  const desc = (txn.description + " " + (txn.merchant || "")).toLowerCase();
  for (const [keyword, category] of MERCHANT_DB) {
    if (desc.includes(keyword)) return category;
  }
  if (txn.type === "credit") return "income";
  return "other";
}

/* -------- Spending Analysis Engine -------- */
function detectRecurring(transactions) {
  const groups = {};
  for (const txn of transactions) {
    const key = `${txn.merchant}_${Math.round(txn.amount/100)*100}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(txn);
  }
  const recurring = [];
  for (const [key, txns] of Object.entries(groups)) {
    if (txns.length < 2) continue;
    txns.sort((a, b) => new Date(a.date) - new Date(b.date));
    for (let i = 1; i < txns.length; i++) {
      const days = (new Date(txns[i].date) - new Date(txns[i-1].date)) / 86400000;
      if (days >= 26 && days <= 34) {
        recurring.push(...txns);
        break;
      }
    }
  }
  return recurring;
}

function findSavingsSuggestions(transactions) {
  const suggestions = [];
  const foodDelivery = transactions.filter(t => t.type === "debit" && (t.merchant || t.description).toLowerCase().includes("foodpanda"));
  const fdTotal = foodDelivery.reduce((s, t) => s + t.amount, 0);
  if (fdTotal > 5000) suggestions.push({
    title: "Reduce Food Delivery",
    desc: `You spent ${fmtPKR(fdTotal)} on food delivery. Cooking 3x/week could save ~${fmtPKR(fdTotal * 0.6)}/month.`,
    saving: fdTotal * 0.6, category: "food"
  });

  const rides = transactions.filter(t => t.type === "debit" && ["careem","uber","indrive"].some(k => (t.merchant||t.description).toLowerCase().includes(k)));
  const rideTotal = rides.reduce((s, t) => s + t.amount, 0);
  if (rideTotal > 8000) suggestions.push({
    title: "Optimize Transport",
    desc: `Ride-hailing cost ${fmtPKR(rideTotal)}. Consider public transport for shorter trips.`,
    saving: rideTotal * 0.4, category: "transport"
  });

  return suggestions;
}

/* -------- AI Advisor -------- */
function aiAnswer(question, transactions, loans, budgets) {
  const q = question.toLowerCase();
  const thirtyDays = transactions.filter(t => new Date(t.date) >= daysAgo(30));
  const income = thirtyDays.filter(t => t.type === "credit").reduce((s, t) => s + t.amount, 0);
  const spending = thirtyDays.filter(t => t.type === "debit").reduce((s, t) => s + t.amount, 0);

  if (q.includes("food") || q.includes("khana")) {
    const food = thirtyDays.filter(t => t.category === "food" && t.type === "debit");
    const total = food.reduce((s, t) => s + t.amount, 0);
    return `🍽 Food Spending (30 days): ${fmtPKR(total)}\n${food.length} transactions\nWeekly avg: ${fmtPKR(total/4.3)}\n\n💡 Cook at home 3x/week → save ~${fmtPKR(total*0.4)}/month`;
  }
  if (q.includes("saving") || q.includes("bachat")) {
    const rate = income > 0 ? ((income - spending) / income * 100) : 0;
    return `💰 Savings Rate: ${rate.toFixed(1)}%\nIncome: ${fmtPKR(income)}\nSpending: ${fmtPKR(spending)}\n\n${rate >= 20 ? "Great job!" : rate >= 10 ? "Try to reach 20%" : "Aim for 50/30/20 rule"}`;
  }
  if (q.includes("eid") || q.includes("ramzan")) {
    const monthly = Math.max(income - spending, income * 0.15);
    return `🌙 Eid Savings Plan\nMonthly potential: ${fmtPKR(monthly)}\n3 months: ${fmtPKR(monthly*3)}\n6 months: ${fmtPKR(monthly*6)}`;
  }
  if (q.includes("fee") || q.includes("charge")) {
    const byBank = {};
    transactions.forEach(t => { const f = t.fee || 0; byBank[t.bankSource] = (byBank[t.bankSource] || 0) + f; });
    let msg = "🏦 Bank Fees:\n";
    for (const [b, f] of Object.entries(byBank)) msg += `${bankLabel(b)}: ${fmtPKR(f)}\n`;
    return msg;
  }
  if (q.includes("unnecessary") || q.includes("waste")) {
    const suggs = findSavingsSuggestions(transactions);
    if (!suggs.length) return "No obvious unnecessary expenses found. You are managing well!";
    return "🔍 Potential Savings:\n" + suggs.map(s => `📌 ${s.title}: ${s.desc}`).join("\n\n");
  }
  if (q.includes("budget")) {
    let msg = "📊 Budgets:\n";
    const monthStart = startOfMonth();
    const monthTxns = transactions.filter(t => new Date(t.date) >= monthStart && t.type === "debit");
    budgets.forEach(b => {
      const spent = monthTxns.filter(t => t.category === b.category).reduce((s, t) => s + t.amount, 0);
      const pct = b.monthlyLimit > 0 ? Math.round(spent / b.monthlyLimit * 100) : 0;
      msg += `${catLabel(b.category)}: ${spent}/${b.monthlyLimit} (${pct}%)\n`;
    });
    return msg || "No budgets set yet.";
  }
  if (q.includes("loan") || q.includes("udhaar") || q.includes("qarz")) {
    const lent = loans.filter(l => l.direction === "iLent" && !l.isFullyRepaid).reduce((s, l) => s + (l.principalAmount - (l.totalRepaid||0)), 0);
    const borrowed = loans.filter(l => l.direction === "iBorrowed" && !l.isFullyRepaid).reduce((s, l) => s + (l.principalAmount - (l.totalRepaid||0)), 0);
    return `🤝 Udhaar:\nOwed to you: ${fmtPKR(lent)}\nYou owe: ${fmtPKR(borrowed)}`;
  }
  if (q.includes("zakat")) {
    const yearTxns = transactions.filter(t => new Date(t.date) >= daysAgo(365));
    const yIncome = yearTxns.filter(t => t.type === "credit").reduce((s, t) => s + t.amount, 0);
    const ySpend = yearTxns.filter(t => t.type === "debit").reduce((s, t) => s + t.amount, 0);
    const net = yIncome - ySpend;
    const zakat = Math.max(net - 130000, 0) * 0.025;
    return `💎 Zakat Est.: ${fmtPKR(zakat)}\nAnnual net: ${fmtPKR(net)}\nNisab (silver): PKR 130,000\n(Estimate — consult a scholar)`;
  }

  return `📈 Summary (30 days)\nIncome: ${fmtPKR(income)}\nSpending: ${fmtPKR(spending)}\nNet: ${fmtPKR(income-spending)}\n\nAsk: "food" "savings" "eid" "fees" "budget" "loans" "zakat"`;
}

function generateTip() {
  const tips = [
    "Set up automatic transfers to savings on payday",
    "Review your subscriptions — using them all?",
    "Cooking at home 2x/week saves PKR 2-3K/month",
    "Carpooling can cut transport by 40%",
    "Check if mobile package still matches usage",
    "Follow 50/30/20: 50% needs, 30% wants, 20% savings"
  ];
  return "💡 " + tips[Math.floor(Math.random() * tips.length)];
}

/* -------- CSV Parser -------- */
function parseCSV(text) {
  const lines = text.split("\n").map(l => l.trim()).filter(l => l);
  if (lines.length < 2) return [];
  const header = lines[0].toLowerCase();
  const cols = header.split(",").map(c => c.trim());
  const dateIdx = cols.findIndex(c => c.includes("date")) || 0;
  const descIdx = cols.findIndex(c => c.includes("desc") || c.includes("narr")) || 1;
  const amtIdx = cols.findIndex(c => c.includes("amount") || c.includes("amt")) || 2;
  const balIdx = cols.findIndex(c => c.includes("balance")) || 4;
  const typeIdx = cols.findIndex(c => c.includes("type")) || -1;

  const txns = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(",").map(p => p.trim());
    if (parts.length < 3) continue;
    const rawAmt = parseFloat(parts[amtIdx]?.replace(/,/g, ""));
    if (isNaN(rawAmt)) continue;
    const txn = new Transaction({
      date: new Date(parts[dateIdx] || Date.now()).toISOString(),
      description: parts[descIdx] || "",
      merchant: parts[descIdx] || "",
      amount: Math.abs(rawAmt),
      type: typeIdx >= 0 ? (parts[typeIdx]?.toLowerCase() === "credit" ? "credit" : "debit") : (rawAmt < 0 ? "debit" : "credit"),
      balance: parseFloat(parts[balIdx]?.replace(/,/g, "")) || null,
      bankSource: "sadapay"
    });
    txn.category = classifyTransaction(txn);
    txns.push(txn);
  }
  return txns;
}

/* -------- App State -------- */
const AppState = {
  currentScreen: "dashboard",
  transactions: [],
  budgets: [],
  savingsGoals: [],
  loans: [],
  bankAccounts: [],
  onboardingCompleted: false,
  selectedTab: 0,
  selectedLoanFilter: "all",
  selectedAnalyticsPeriod: "thisMonth",
  selectedAnalyticsTab: 0,
  txFilter: { bank: null, category: null, type: null, search: "", groupBy: "month", sort: "newest" },
  importStep: "idle",
  importTxns: [],
  importBank: null,
  chatMessages: [],
};

/* -------- Render Engine -------- */
function renderPage() {
  const content = document.getElementById("content");
  const screen = AppState.currentScreen;
  if (screen === "dashboard") renderDashboard(content);
  else if (screen === "transactions") renderTransactions(content);
  else if (screen === "analytics") renderAnalytics(content);
  else if (screen === "budget") renderBudget(content);
  else if (screen === "savings") renderSavings(content);
  else if (screen === "advisor") renderAdvisor(content);
  else if (screen === "import") renderImport(content);
  else if (screen === "loans") renderLoans(content);
  else if (screen === "loanDetail") renderLoanDetail(content);
  else if (screen === "settings") renderSettings(content);
  else if (screen === "onboarding") renderOnboarding(content);
  updateTabBar();
}

function navigate(screen) {
  AppState.currentScreen = screen;
  renderPage();
  document.getElementById("content").scrollTop = 0;
}

function updateTabBar() {
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
  const activeTab = AppState.selectedTab;
  document.querySelectorAll(".tab-btn")[activeTab]?.classList.add("active");

  const tabs = ["dashboard", "transactions", "analytics", "loans", "settings"];
  if (tabs.includes(AppState.currentScreen))
    AppState.selectedTab = tabs.indexOf(AppState.currentScreen);
}

async function loadAllData() {
  const [txns, budgets, goals, loans, accounts] = await Promise.all([
    dbGetAll("transactions"), dbGetAll("budgets"), dbGetAll("savingsGoals"),
    dbGetAll("loans"), dbGetAll("bankAccounts")
  ]);
  AppState.transactions = txns.sort((a, b) => new Date(b.date) - new Date(a.date));
  AppState.budgets = budgets;
  AppState.savingsGoals = goals;
  AppState.loans = loans.map(l => {
    l.totalRepaid = (l.repayments || []).reduce((s, r) => s + r.amount, 0);
    l.remainingAmount = l.principalAmount - l.totalRepaid;
    l.isFullyRepaid = l.remainingAmount <= 0;
    l.isOverdue = l.dueDate ? new Date() > new Date(l.dueDate) && !l.isFullyRepaid : false;
    return l;
  });
  AppState.bankAccounts = accounts;
}
/* ============ DASHBOARD ============ */
function renderDashboard(el) {
  var now = new Date();
  var monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  var txns = AppState.transactions;
  var monthTxns = txns.filter(function(t) { return new Date(t.date) >= monthStart; });
  var income = monthTxns.filter(function(t) { return t.type === "credit"; }).reduce(function(s, t) { return s + t.amount; }, 0);
  var spending = monthTxns.filter(function(t) { return t.type === "debit"; }).reduce(function(s, t) { return s + t.amount; }, 0);
  var netWorth = AppState.bankAccounts.reduce(function(s, a) { return s + (a.currentBalance||0); }, 0);
  var net = income - spending;
  var catSpending = {};
  monthTxns.filter(function(t) { return t.type === "debit"; }).forEach(function(t) {
    catSpending[t.category] = (catSpending[t.category] || 0) + t.amount;
  });
  var topCats = Object.entries(catSpending).sort(function(a, b) { return b[1] - a[1]; }).slice(0, 5);

  var last7 = [];
  for (var i = 6; i >= 0; i--) {
    var d = new Date(); d.setDate(d.getDate() - i);
    var dayStr = d.toISOString().slice(0, 10);
    var amt = txns.filter(function(t) { return t.date.startsWith(dayStr) && t.type === "debit"; }).reduce(function(s, t) { return s + t.amount; }, 0);
    last7.push({ label: d.toLocaleDateString("en", { weekday: "short" }), amount: amt });
  }

  var loansLent = AppState.loans.filter(function(l) { return l.direction === "iLent" && !l.isFullyRepaid && !l.isForgiven; }).reduce(function(s, l) { return s + (l.remainingAmount||0); }, 0);
  var loansBorrowed = AppState.loans.filter(function(l) { return l.direction === "iBorrowed" && !l.isFullyRepaid && !l.isForgiven; }).reduce(function(s, l) { return s + (l.remainingAmount||0); }, 0);
  var overdue = AppState.loans.filter(function(l) { return l.isOverdue; });
  var recentHtml = txns.slice(0, 8).map(function(t) { return txnRow(t); }).join("");
  var overdueHtml = overdue.length ? '<div class="alert-red" onclick="navigate(\'loans\')">' + overdue.length + ' loan(s) overdue - Tap to view</div>' : "";

  el.innerHTML = '<div class="dash-header"><div><div class="text-secondary">' + fmtMonthYear(now) + '</div><div class="title">Welcome back</div></div></div>' +
    '<div class="card net-worth"><div class="text-secondary small">Total Net Worth</div><div class="amount-large" style="color:var(--accent)">' + fmtPKR(netWorth) + '</div>' +
    '<div class="row gap-20" style="justify-content:center;margin-top:8px"><span style="color:var(--accent)">' + fmtPKR(income, true) + '</span><span style="color:var(--danger)">' + fmtPKR(spending, true) + '</span><span style="color:var(--gold)">' + fmtPKR(net, true) + '</span></div></div>' +
    '<div class="row gap-12"><div class="stat-card"><div class="small text-secondary">Income</div><div class="h3" style="color:var(--accent)">' + fmtPKR(income, true) + '</div></div>' +
    '<div class="stat-card"><div class="small text-secondary">Spending</div><div class="h3" style="color:var(--danger)">' + fmtPKR(spending, true) + '</div></div>' +
    '<div class="stat-card"><div class="small text-secondary">Saved</div><div class="h3" style="color:var(--gold)">' + fmtPKR(net, true) + '</div></div></div>' +
    '<div class="card"><div class="subtitle">Spending Trend (7 Days)</div><canvas id="trendChart" height="140"></canvas></div>' +
    '<div class="card"><div class="subtitle">Top Spending Categories</div><canvas id="donutChart" height="200"></canvas></div>' +
    overdueHtml +
    '<div class="card"><div class="row sb" style="margin-bottom:8px"><span class="subtitle">Recent</span><span class="link" onclick="navigate(\'transactions\')">See All</span></div>' + recentHtml + '</div>' +
    '<div class="row gap-12" style="margin-top:8px"><button class="fab-btn" onclick="navigate(\'import\')">Import</button><button class="fab-btn" onclick="navigate(\'advisor\')">AI Advisor</button><button class="fab-btn" onclick="navigate(\'loans\')">Udhaar</button></div>';

  setTimeout(function() {
    drawBarChart("trendChart", last7.map(function(d) { return d.label; }), last7.map(function(d) { return d.amount; }), "#FF4757");
    drawDonutChart("donutChart", topCats);
  }, 100);
}

function txnRow(t) {
  return '<div class="txn-row"><div class="txn-icon" style="background:' + catColor(t.category) + '20">' + catIcon(t.category) + '</div><div class="txn-info"><div class="text-pri">' + (t.merchant || t.description) + '</div><div class="text-sec small">' + catLabel(t.category) + ' ' + fmtDateShort(t.date) + '</div></div><div class="txn-amt" style="color:' + (t.type==="credit"?"var(--accent)":"var(--danger)") + '">' + (t.type==="debit"?"-":"") + fmtPKR(t.amount, true) + '</div></div>';
}

function navigate(screen) {
  AppState.currentScreen = screen;
  renderPage();
  document.getElementById("content").scrollTop = 0;
  updateTabBar();
}

function updateTabBar() {
  document.querySelectorAll(".tab-btn").forEach(function(b) { b.classList.remove("active"); });
  var tabs = ["dashboard", "transactions", "analytics", "loans", "settings"];
  var idx = tabs.indexOf(AppState.currentScreen);
  if (idx >= 0) AppState.selectedTab = idx;
  var active = document.querySelectorAll(".tab-btn")[AppState.selectedTab];
  if (active) active.classList.add("active");
}/* ============ TRANSACTIONS ============ */
function renderTransactions(el) {
  var txns = AppState.transactions.slice();
  var f = AppState.txFilter;
  if (f.search) txns = txns.filter(function(t) { return (t.merchant+" "+t.description).toLowerCase().includes(f.search.toLowerCase()); });
  if (f.bank) txns = txns.filter(function(t) { return t.bankSource === f.bank; });
  if (f.category) txns = txns.filter(function(t) { return t.category === f.category; });
  if (f.type) txns = txns.filter(function(t) { return t.type === f.type; });

  var groups = {};
  txns.forEach(function(t) {
    var key, d = new Date(t.date);
    if (f.groupBy === "day") key = d.toLocaleDateString("en-PK", { day: "numeric", month: "long", year: "numeric" });
    else if (f.groupBy === "week") { var ws = new Date(d); ws.setDate(d.getDate()-d.getDay()); key = "Week of " + ws.toLocaleDateString("en-PK", { day: "numeric", month: "short" }); }
    else key = d.toLocaleDateString("en-PK", { month: "long", year: "numeric" });
    if (!groups[key]) groups[key] = [];
    groups[key].push(t);
  });

  var bankChips = BANKS.filter(function(b) { return b.key !== "cash"; }).map(function(b) {
    return '<div class="chip ' + (f.bank===b.key?"active":"") + '" onclick="AppState.txFilter.bank=AppState.txFilter.bank===' + JSON.stringify(b.key) + '?null:' + JSON.stringify(b.key) + ';renderPage()">' + b.label + '</div>';
  }).join("");
  var catChips = CATEGORIES.map(function(c) {
    return '<div class="chip ' + (f.category===c.key?"active":"") + '" onclick="AppState.txFilter.category=AppState.txFilter.category===' + JSON.stringify(c.key) + '?null:' + JSON.stringify(c.key) + ';renderPage()">' + c.label + '</div>';
  }).join("");

  var listHtml = "";
  var keys = Object.keys(groups);
  if (keys.length === 0) listHtml = '<div class="empty">No transactions found</div>';
  else keys.forEach(function(grp) {
    listHtml += '<div class="group-header">' + grp + '</div>';
    groups[grp].forEach(function(t) { listHtml += txnRow(t); });
  });

  el.innerHTML = '<div class="search-bar"><input placeholder="Search..." value="' + f.search + '" oninput="AppState.txFilter.search=this.value;renderPage()"></div>' +
    '<div class="chip-row"><div class="chip ' + (!f.bank?"active":"") + '" onclick="AppState.txFilter.bank=null;renderPage()">All Banks</div>' + bankChips + '</div>' +
    '<div class="chip-row"><div class="chip ' + (!f.category?"active":"") + '" onclick="AppState.txFilter.category=null;renderPage()">All</div>' + catChips + '</div>' +
    '<div class="row gap-8" style="padding:8px 0"><select class="sel" onchange="AppState.txFilter.groupBy=this.value;renderPage()">' +
    '<option value="month" ' + (f.groupBy==="month"?"selected":"") + '>Monthly</option>' +
    '<option value="week" ' + (f.groupBy==="week"?"selected":"") + '>Weekly</option>' +
    '<option value="day" ' + (f.groupBy==="day"?"selected":"") + '>Daily</option></select>' +
    '<button class="chip" onclick="AppState.txFilter={bank:null,category:null,type:null,search:\"\",groupBy:\"month\"};renderPage()">Clear Filters</button></div>' +
    listHtml;
}/* ============ ANALYTICS ============ */
function renderAnalytics(el) {
  var p = AppState.selectedAnalyticsPeriod, now = new Date(), startDate;
  if (p === "thisWeek") startDate = daysAgo(7);
  else if (p === "thisMonth") startDate = daysAgo(30);
  else if (p === "last3Months") startDate = new Date(now.getFullYear(), now.getMonth()-3, 1);
  else startDate = new Date(now.getFullYear(), now.getMonth()-6, 1);

  var rangeTxns = AppState.transactions.filter(function(t) { return new Date(t.date) >= startDate && t.type === "debit"; });
  var catData = {};
  rangeTxns.forEach(function(t) { catData[t.category] = (catData[t.category] || 0) + t.amount; });
  var catArr = Object.entries(catData).sort(function(a,b) { return b[1]-a[1]; });
  var tab = AppState.selectedAnalyticsTab;

  var body = "";
  if (tab === 0) {
    body = '<div class="card"><div class="subtitle">Spending by Category</div><canvas id="analDonut" height="220"></canvas></div>' +
      catArr.map(function(e) { return '<div class="card cat-row"><span>' + catIcon(e[0]) + ' ' + catLabel(e[0]) + '</span><span>' + fmtPKR(e[1]) + '</span></div>'; }).join("");
  } else if (tab === 1) {
    var months = [];
    for (var i = 5; i >= 0; i--) {
      var d = new Date(); d.setMonth(d.getMonth() - i);
      var s = new Date(d.getFullYear(), d.getMonth(), 1), e = new Date(d.getFullYear(), d.getMonth()+1, 0);
      var amt = AppState.transactions.filter(function(t) { var td = new Date(t.date); return td >= s && td <= e && t.type === "debit"; }).reduce(function(s,t) { return s+t.amount; }, 0);
      months.push({ label: d.toLocaleDateString("en", { month: "short", year: "2-digit" }), amount: amt });
    }
    body = '<div class="card"><div class="subtitle">Monthly Spending</div><canvas id="trendBar" height="200"></canvas></div>';
    AppState._trendData = months;
  } else if (tab === 2) {
    var banks = {};
    AppState.transactions.filter(function(t) { return t.type === "debit"; }).forEach(function(t) { banks[t.bankSource] = (banks[t.bankSource] || 0) + t.amount; });
    var barr = Object.entries(banks).sort(function(a,b) { return b[1]-a[1]; });
    body = '<div class="card"><div class="subtitle">Spending by Bank</div><canvas id="bankChart" height="200"></canvas></div>' +
      barr.map(function(e) { return '<div class="card cat-row"><span style="color:' + bankColor(e[0]) + '">● ' + bankLabel(e[0]) + '</span><span>' + fmtPKR(e[1]) + '</span></div>'; }).join("");
    AppState._bankData = barr;
  } else if (tab === 3) {
    var m = {};
    AppState.transactions.filter(function(t) { return t.type === "debit"; }).forEach(function(t) {
      var name = t.merchant || t.description;
      if (!m[name]) m[name] = { total: 0, count: 0 };
      m[name].total += t.amount; m[name].count++;
    });
    var sorted = Object.entries(m).sort(function(a,b) { return b[1].total - a[1].total; }).slice(0, 10);
    body = '<div class="card"><div class="subtitle">Top Merchants</div>' +
      sorted.map(function(e, i) { return '<div class="cat-row"><span>' + (i+1) + '. ' + e[0] + ' (' + e[1].count + 'x)</span><span style="color:var(--danger)">' + fmtPKR(e[1].total) + '</span></div>'; }).join("") +
      '</div>';
  } else {
    var lent = AppState.loans.filter(function(l) { return l.direction === "iLent"; }).reduce(function(s,l) { return s + l.principalAmount; }, 0);
    var borrowed = AppState.loans.filter(function(l) { return l.direction === "iBorrowed"; }).reduce(function(s,l) { return s + l.principalAmount; }, 0);
    body = '<div class="row gap-12"><div class="stat-card"><div class="small">Total Lent</div><div class="h3" style="color:var(--accent)">' + fmtPKR(lent, true) + '</div></div><div class="stat-card"><div class="small">Total Borrowed</div><div class="h3" style="color:var(--danger)">' + fmtPKR(borrowed,true) + '</div></div></div><div class="card"><div class="subtitle">Pending Aging</div><canvas id="udhaarChart" height="160"></canvas></div>';
  }

  el.innerHTML = '<div class="chip-row" style="margin-bottom:12px">' +
    ["thisWeek","thisMonth","last3Months","last6Months"].map(function(per) {
      return '<div class="chip ' + (p===per?"active":"") + '" onclick="AppState.selectedAnalyticsPeriod=\'' + per + '\';renderPage()">' + (per==="thisWeek"?"Week":per==="thisMonth"?"Month":per==="last3Months"?"3M":"6M") + '</div>';
    }).join("") + '</div>' +
    '<div class="tabs"><div class="tab ' + (tab===0?"active":"") + '" onclick="AppState.selectedAnalyticsTab=0;renderPage()">Categories</div>' +
    '<div class="tab ' + (tab===1?"active":"") + '" onclick="AppState.selectedAnalyticsTab=1;renderPage()">Trends</div>' +
    '<div class="tab ' + (tab===2?"active":"") + '" onclick="AppState.selectedAnalyticsTab=2;renderPage()">Banks</div>' +
    '<div class="tab ' + (tab===3?"active":"") + '" onclick="AppState.selectedAnalyticsTab=3;renderPage()">Merchants</div>' +
    '<div class="tab ' + (tab===4?"active":"") + '" onclick="AppState.selectedAnalyticsTab=4;renderPage()">Udhaar</div></div>' + body;

  setTimeout(function() {
    if (tab === 0 && catArr.length) drawDonutChart("analDonut", catArr);
    if (tab === 1 && AppState._trendData) drawBarChart("trendBar", AppState._trendData.map(function(d){return d.label}), AppState._trendData.map(function(d){return d.amount}), "#FF4757");
    if (tab === 2 && AppState._bankData) drawBarChart("bankChart", AppState._bankData.map(function(e){return bankLabel(e[0])}), AppState._bankData.map(function(e){return e[1]}), "#FF6B6B");
    if (tab === 4) drawUdhaarChart();
  }, 100);
}

/* ============ BUDGET ============ */
function renderBudget(el) {
  var monthStart = startOfMonth();
  var monthTxns = AppState.transactions.filter(function(t) { return new Date(t.date) >= monthStart && t.type === "debit"; });
  var totalBudgeted = AppState.budgets.reduce(function(s, b) { return s + b.monthlyLimit; }, 0);
  var totalSpent = monthTxns.reduce(function(s, t) { return s + t.amount; }, 0);

  var cards = AppState.budgets.map(function(b) {
    var spent = monthTxns.filter(function(t) { return t.category === b.category; }).reduce(function(s, t) { return s + t.amount; }, 0);
    var pct = Math.min(spent / b.monthlyLimit, 1);
    var color = pct < 0.5 ? "var(--accent)" : pct < 0.8 ? "var(--gold)" : "var(--danger)";
    return '<div class="card"><div class="row sb"><span>' + catIcon(b.category) + ' ' + catLabel(b.category) + '</span><span style="color:' + color + '">' + fmtPKR(spent, true) + ' / ' + fmtPKR(b.monthlyLimit, true) + '</span></div>' +
      '<div class="progress-bar"><div class="progress-fill" style="width:' + (pct*100) + '%;background:' + color + '"></div></div>' +
      '<div class="row sb small text-secondary"><span>' + Math.round(pct*100) + '% used</span><span>' + fmtPKR(Math.max(b.monthlyLimit-spent, 0), true) + ' left</span></div></div>';
  }).join("");

  el.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><div class="title">Budget Manager</div><button class="btn-primary" onclick="showAddBudget()">+ Add Budget</button></div>' +
    '<div class="row gap-12"><div class="stat-card"><div class="small">Budgeted</div><div class="h3" style="color:var(--accent)">' + fmtPKR(totalBudgeted, true) + '</div></div>' +
    '<div class="stat-card"><div class="small">Spent</div><div class="h3" style="color:var(--danger)">' + fmtPKR(totalSpent, true) + '</div></div></div>' +
    cards + (AppState.budgets.length === 0 ? '<div class="empty">No budgets set. Tap + Add Budget!</div>' : "");
}/* ============ SAVINGS ============ */
function renderSavings(el) {
  var monthTxns = AppState.transactions.filter(function(t) { return new Date(t.date) >= startOfMonth(); });
  var income = monthTxns.filter(function(t) { return t.type === "credit"; }).reduce(function(s, t) { return s + t.amount; }, 0);
  var spending = monthTxns.filter(function(t) { return t.type === "debit"; }).reduce(function(s, t) { return s + t.amount; }, 0);
  var rate = income > 0 ? ((income - spending) / income * 100) : 0;
  var yearTxns = AppState.transactions.filter(function(t) { return new Date(t.date) >= daysAgo(365); });
  var yIncome = yearTxns.filter(function(t) { return t.type === "credit"; }).reduce(function(s,t) { return s+t.amount; }, 0);
  var ySpend = yearTxns.filter(function(t) { return t.type === "debit"; }).reduce(function(s,t) { return s+t.amount; }, 0);
  var zakat = Math.max((yIncome - ySpend) - 130000, 0) * 0.025;
  var needs = monthTxns.filter(function(t) { return ["utilities","food","billPayment","health","mobileTopup"].indexOf(t.category)>=0; }).reduce(function(s,t){return s+t.amount;},0);
  var wants = monthTxns.filter(function(t) { return ["entertainment","shopping","transport"].indexOf(t.category)>=0; }).reduce(function(s,t){return s+t.amount;},0);
  var saved = Math.max(income - needs - wants, 0);

  var goalsHtml = AppState.savingsGoals.map(function(g) {
    var pct = Math.min(g.currentAmount / g.targetAmount, 1);
    return '<div class="card"><div class="row sb"><span class="subtitle">' + g.name + '</span>' + (g.isCompleted?'<span style="color:var(--gold)">Done</span>':'') + '</div>' +
      '<div class="ring-container"><svg width="80" height="80"><circle cx="40" cy="40" r="34" stroke="var(--surface-elevated)" stroke-width="8" fill="none"/>' +
      '<circle cx="40" cy="40" r="34" stroke="var(--gold)" stroke-width="8" fill="none" stroke-dasharray="' + (pct*213.6) + ' 213.6" stroke-linecap="round" transform="rotate(-90 40 40)"/></svg>' +
      '<div class="ring-text small">' + Math.round(pct*100) + '%</div></div>' +
      '<div class="small text-secondary">' + fmtPKR(g.currentAmount, true) + ' of ' + fmtPKR(g.targetAmount) + '</div>' +
      '<div class="small" style="color:var(--accent);margin-top:8px">Tip: save ~' + fmtPKR(Math.round(rate/100*income/12), true) + '/month toward this goal</div></div>';
  }).join("");

  el.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><div class="title">Savings and Goals</div><button class="btn-primary" onclick="showAddGoal()">+ Add Goal</button></div>' +
    '<div class="card" style="text-align:center"><div class="subtitle">Monthly Savings Rate</div>' +
    '<div class="ring-container"><svg width="120" height="120"><circle cx="60" cy="60" r="50" stroke="var(--surface-elevated)" stroke-width="12" fill="none"/>' +
    '<circle cx="60" cy="60" r="50" stroke="var(--gold)" stroke-width="12" fill="none" stroke-dasharray="' + (rate/100*314.16) + ' 314.16" stroke-linecap="round" transform="rotate(-90 60 60)"/></svg>' +
    '<div class="ring-text">' + rate.toFixed(1) + '%</div></div></div>' +
    '<div class="card"><div class="subtitle">50/30/20 Rule</div>' +
    '<div class="row gap-0" style="border-radius:8px;overflow:hidden;margin-top:8px">' +
    '<div style="flex:' + needs + ';min-width:30px;background:var(--danger);padding:6px;text-align:center;font-size:10px">Needs ' + (income>0?Math.round(needs/income*100):0) + '%</div>' +
    '<div style="flex:' + wants + ';min-width:30px;background:var(--gold);padding:6px;text-align:center;font-size:10px">Wants ' + (income>0?Math.round(wants/income*100):0) + '%</div>' +
    '<div style="flex:' + saved + ';min-width:30px;background:var(--accent);padding:6px;text-align:center;font-size:10px">Savings ' + (income>0?Math.round(saved/income*100):0) + '%</div></div></div>' +
    '<div class="card"><div class="subtitle">Zakat Calculator</div><div class="h2" style="color:var(--gold)">' + fmtPKR(zakat) + '</div><div class="small text-secondary">2.5% of savings above Nisab (PKR 130K) - Estimate only</div></div>' +
    goalsHtml + (AppState.savingsGoals.length === 0 ? '<div class="empty">No savings goals yet</div>' : "");
}

/* ============ AI ADVISOR ============ */
function renderAdvisor(el) {
  var msgs = AppState.chatMessages;
  el.innerHTML = '<div class="title" style="margin-bottom:12px">AI Financial Advisor</div>' +
    '<div id="chatMsgs" style="flex:1;overflow-y:auto;padding:8px 0">' +
    msgs.map(function(m) { return '<div class="chat-msg ' + (m.isUser?"user":"bot") + '">' + m.text.replace(/\n/g,"<br>") + '</div>'; }).join("") + '</div>' +
    '<div style="display:flex;gap:8px;padding:8px 0;border-top:1px solid var(--surface-elevated);margin-top:8px">' +
    '<input class="inp" id="chatInput" placeholder="Ask about your finances..." style="flex:1" onkeydown="if(event.key===' + String.fromCharCode(39) + 'Enter' + String.fromCharCode(39) + ')sendChat()">' +
    '<button class="btn-primary" onclick="sendChat()">Send</button></div>' +
    '<div style="margin-top:8px">' + ["How much did I spend on food?","Am I saving enough?","What are my unnecessary expenses?","How are my budgets?","Calculate zakat"].map(function(q) {
      return '<div class="chip" onclick="quickChat(\'' + q + '\')">' + q + '</div>';
    }).join("") + '</div>';

  setTimeout(function() {
    var chatEl = document.getElementById("chatMsgs");
    if (chatEl) chatEl.scrollTop = chatEl.scrollHeight;
  }, 100);
}

function sendChat() {
  var inp = document.getElementById("chatInput");
  if (!inp) return;
  var q = inp.value.trim();
  if (!q) return;
  inp.value = "";
  AppState.chatMessages.push({ text: q, isUser: true });
  var answer = aiAnswer(q, AppState.transactions, AppState.loans, AppState.budgets);
  setTimeout(function() { AppState.chatMessages.push({ text: answer, isUser: false }); renderPage(); }, 300);
  renderPage();
}

function quickChat(q) {
  document.getElementById("chatInput").value = q;
  sendChat();
}/* ============ IMPORT ============ */
function renderImport(el) {
  var bankBtns = BANKS.filter(function(b) { return b.key !== "cash"; }).map(function(b) {
    return '<div class="bank-chip ' + (AppState.importBank===b.key?"selected":"") + '" onclick="AppState.importBank=AppState.importBank===' + JSON.stringify(b.key) + '?null:' + JSON.stringify(b.key) + ';renderPage()" style="border-color:' + b.color + ';' + (AppState.importBank===b.key?"background:"+b.color+"20;":"") + '">' + b.label + '</div>';
  }).join("");

  var body;
  if (AppState.importStep === "idle") {
    body = '<div class="upload-zone" onclick="document.getElementById(\'fileInput\').click()"><div style="font-size:40px">PDF</div><div>Tap to Select Statement</div><div class="small text-secondary">CSV files supported</div><input type="file" id="fileInput" accept=".csv" style="display:none" onchange="handleFileImport(this.files[0])"></div>';
  } else if (AppState.importStep === "preview") {
    body = '<div class="card"><div class="subtitle">Preview (' + AppState.importTxns.length + ' transactions)</div>' +
      AppState.importTxns.slice(0, 8).map(function(t) { return txnRow(t); }).join("") +
      '<div class="row gap-8" style="margin-top:8px"><button class="btn-secondary" onclick="AppState.importStep=\'idle\';renderPage()">Cancel</button><button class="btn-primary" onclick="confirmImport()">Confirm Import</button></div></div>';
  } else if (AppState.importStep === "complete") {
    body = '<div class="alert-green">Imported successfully! ' + AppState.importTxns.length + ' transactions added.</div>';
  } else {
    body = '<div class="upload-zone"><div class="spinner"></div><div>' + (AppState.importStep==="detecting"?"Detecting Bank...":AppState.importStep==="parsing"?"Parsing...":"Categorizing...") + '</div></div>';
  }

  el.innerHTML = '<div class="title" style="margin-bottom:12px">Import Statement</div><div class="row gap-8" style="flex-wrap:wrap;margin-bottom:12px">' + bankBtns + '</div>' + body;
}

async function handleFileImport(file) {
  if (!file) return;
  AppState.importStep = "detecting"; renderPage();
  var text = await file.text();
  AppState.importStep = "parsing"; renderPage();
  var txns = parseCSV(text);
  AppState.importStep = "categorizing"; renderPage();
  txns.forEach(function(t) {
    if (AppState.importBank) t.bankSource = AppState.importBank;
  });
  AppState.importTxns = txns;
  AppState.importStep = "preview";
  renderPage();
}

async function confirmImport() {
  for (var i = 0; i < AppState.importTxns.length; i++) {
    await dbPut("transactions", AppState.importTxns[i]);
  }
  await loadAllData();
  AppState.importStep = "complete";
  renderPage();
  setTimeout(function() { AppState.importStep = "idle"; AppState.importTxns = []; renderPage(); }, 2000);
}

/* ============ LOANS ============ */
function renderLoans(el) {
  var loans = AppState.loans, f = AppState.selectedLoanFilter;
  if (f === "iLent") loans = loans.filter(function(l) { return l.direction === "iLent" && !l.isFullyRepaid; });
  else if (f === "iBorrowed") loans = loans.filter(function(l) { return l.direction === "iBorrowed" && !l.isFullyRepaid; });
  else if (f === "overdue") loans = loans.filter(function(l) { return l.isOverdue; });
  else if (f === "fullyRepaid") loans = loans.filter(function(l) { return l.isFullyRepaid; });
  else loans = loans.filter(function(l) { return !l.isFullyRepaid; });

  var lent = AppState.loans.filter(function(l) { return l.direction === "iLent" && !l.isFullyRepaid && !l.isForgiven; }).reduce(function(s,l) { return s + (l.remainingAmount||0); }, 0);
  var borrowed = AppState.loans.filter(function(l) { return l.direction === "iBorrowed" && !l.isFullyRepaid && !l.isForgiven; }).reduce(function(s,l) { return s + (l.remainingAmount||0); }, 0);

  el.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><div class="title">Udhaar Manager</div><button class="btn-primary" onclick="showAddLoan()">+ Add Udhaar</button></div>' +
    '<div class="row gap-12"><div class="stat-card"><div class="small">Owed to You</div><div class="h3" style="color:var(--accent)">' + fmtPKR(lent, true) + '</div></div>' +
    '<div class="stat-card"><div class="small">You Owe</div><div class="h3" style="color:var(--danger)">' + fmtPKR(borrowed, true) + '</div></div></div>' +
    '<div class="chip-row">' + ["all","iLent","iBorrowed","overdue","fullyRepaid"].map(function(fl) {
      return '<div class="chip ' + (f===fl?"active":"") + '" onclick="AppState.selectedLoanFilter=' + JSON.stringify(fl) + ';renderPage()">' + (fl==="all"?"Active":fl==="iLent"?"I Lent":fl==="iBorrowed"?"I Borrowed":fl==="overdue"?"Overdue":"History") + '</div>';
    }).join("") + '</div>' +
    loans.map(function(l) { return loanCard(l); }).join("") +
    (loans.length === 0 ? '<div class="empty">No loans found</div>' : "");
}

function loanCard(l) {
  var pct = l.principalAmount > 0 ? (l.totalRepaid||0) / l.principalAmount : 0;
  return '<div class="card" style="cursor:pointer" onclick="viewLoan(\'' + l.id + '\')"><div class="row sb"><span class="subtitle">' + l.personName + '</span>' +
    '<span class="badge" style="background:' + (l.direction==="iLent"?"var(--accent)20":"var(--danger)20") + ';color:' + (l.direction==="iLent"?"var(--accent)":"var(--danger)") + '">' + (l.direction==="iLent"?"OWES YOU":"YOU OWE") + '</span></div>' +
    '<div style="margin:4px 0">' + fmtPKR(l.principalAmount) + ' ' + fmtDate(l.dateGiven) + '</div>' +
    (l.dueDate ? '<div style="color:' + (l.isOverdue?"var(--danger)":"var(--text-secondary)") + ';font-size:12px">Due: ' + fmtDate(l.dueDate) + (l.isOverdue?" OVERDUE":"") + '</div>' : "") +
    (l.loanDescription ? '<div class="small text-secondary">' + l.loanDescription + '</div>' : "") +
    (pct > 0 ? '<div class="progress-bar" style="margin-top:8px"><div class="progress-fill" style="width:' + (pct*100) + '%;background:' + (l.direction==="iLent"?"var(--accent)":"var(--danger)") + '"></div></div>' +
    '<div class="row sb small text-secondary"><span>' + fmtPKR(l.totalRepaid, true) + ' repaid</span><span>' + fmtPKR(l.remainingAmount, true) + ' left</span></div>' : "") + '</div>';
}

function viewLoan(id) {
  AppState.viewingLoanId = id;
  AppState.currentScreen = "loanDetail";
  renderPage();
}

function renderLoanDetail(el) {
  var l = AppState.loans.find(function(x) { return x.id === AppState.viewingLoanId; });
  if (!l) { navigate("loans"); return; }
  var pct = l.principalAmount > 0 ? (l.totalRepaid||0) / l.principalAmount : 0;
  var repays = (l.repayments||[]).sort(function(a,b){ return new Date(b.date)-new Date(a.date); });

  el.innerHTML = '<div style="margin-bottom:8px"><span class="link" onclick="navigate(\'loans\')">Back</span></div>' +
    '<div class="card"><div class="title">' + l.personName + '</div>' +
    '<div class="row gap-8" style="margin:8px 0"><span class="badge" style="background:' + (l.direction==="iLent"?"var(--accent)20":"var(--danger)20") + ';color:' + (l.direction==="iLent"?"var(--accent)":"var(--danger)") + '">' + (l.direction==="iLent"?"You Lent":"You Borrowed") + '</span>' +
    '<span class="badge" style="background:' + (l.isFullyRepaid?"var(--accent)20":l.isOverdue?"var(--danger)20":"var(--gold)20") + ';color:' + (l.isFullyRepaid?"var(--accent)":l.isOverdue?"var(--danger)":"var(--gold)") + '">' + (l.isFullyRepaid?"Repaid":l.isOverdue?"Overdue":l.totalRepaid>0?"Partial":"Active") + '</span></div>' +
    '<div class="h2">' + fmtPKR(l.principalAmount) + '</div><div class="small text-secondary">Given: ' + fmtDate(l.dateGiven) + ' Due: ' + (l.dueDate?fmtDate(l.dueDate):"No due date") + '</div>' +
    (l.loanDescription ? '<div style="margin-top:4px">' + l.loanDescription + '</div>' : "") + '</div>' +
    '<div class="card"><div class="subtitle">Repayment Progress</div><div class="progress-bar" style="margin:8px 0"><div class="progress-fill" style="width:' + (pct*100) + '%;background:' + (l.direction==="iLent"?"var(--accent)":"var(--danger)") + '"></div></div>' +
    '<div class="row sb"><span style="color:var(--accent)">' + fmtPKR(l.totalRepaid||0, true) + ' repaid</span><span style="color:' + (l.isFullyRepaid?"var(--accent)":"var(--danger)") + '">' + fmtPKR(l.remainingAmount, true) + ' remaining</span></div></div>' +
    '<div class="card"><div class="subtitle">Repayment History</div>' +
    (repays.length === 0 ? '<div class="small text-secondary">No repayments yet</div>' :
      repays.map(function(r) { return '<div class="cat-row"><span>' + fmtPKR(r.amount) + ' ' + fmtDate(r.date) + '</span><span class="small text-secondary">' + (r.note||"") + '</span></div>'; }).join("")) + '</div>' +
    (!l.isFullyRepaid ? '<button class="btn-primary full-width" onclick="showRecordRepayment(\'' + l.id + '\')">+ Record Repayment</button><button class="btn-secondary full-width" style="margin-top:8px;color:var(--danger)" onclick="forgiveLoan(\'' + l.id + '\')">Mark as Forgiven</button>' : "");
}/* ============ MODALS ============ */
function showAddBudget() {
  var cats = CATEGORIES.map(function(c) { return '<option value="' + c.key + '">' + c.label + '</option>'; }).join("");
  document.getElementById("modal").innerHTML = '<div class="modal-overlay" onclick="closeModal()"><div class="modal" onclick="event.stopPropagation()"><div class="subtitle">New Budget</div><select class="sel" id="budgetCat">' + cats + '</select><input class="inp" id="budgetLimit" type="number" placeholder="Monthly limit (PKR)" style="margin-top:12px"><label style="display:flex;align-items:center;gap:8px;margin-top:8px"><input type="checkbox" id="budgetRoll"> Rollover unused</label><button class="btn-primary" style="margin-top:12px" onclick="saveBudget()">Save</button></div></div>';
}

async function saveBudget() {
  var cat = document.getElementById("budgetCat").value;
  var limit = parseFloat(document.getElementById("budgetLimit").value);
  if (!limit || limit <= 0) return;
  await dbPut("budgets", { id: uid(), category: cat, monthlyLimit: limit, rolloverEnabled: document.getElementById("budgetRoll").checked, createdAt: new Date().toISOString() });
  closeModal(); await loadAllData(); renderPage();
}

function showAddGoal() {
  document.getElementById("modal").innerHTML = '<div class="modal-overlay" onclick="closeModal()"><div class="modal" onclick="event.stopPropagation()"><div class="subtitle">New Savings Goal</div><input class="inp" id="goalName" placeholder="Goal name" style="margin-top:12px"><input class="inp" id="goalTarget" type="number" placeholder="Target amount (PKR)" style="margin-top:8px"><button class="btn-primary" style="margin-top:12px" onclick="saveGoal()">Save</button></div></div>';
}

async function saveGoal() {
  var name = document.getElementById("goalName").value;
  var target = parseFloat(document.getElementById("goalTarget").value);
  if (!name || !target) return;
  await dbPut("savingsGoals", { id: uid(), name: name, targetAmount: target, currentAmount: 0, createdAt: new Date().toISOString(), isCompleted: false });
  closeModal(); await loadAllData(); renderPage();
}

function showAddLoan() {
  var banks = BANKS.map(function(b) { return '<option value="' + b.key + '">' + b.label + '</option>'; }).join("");
  document.getElementById("modal").innerHTML = '<div class="modal-overlay" onclick="closeModal()"><div class="modal" onclick="event.stopPropagation()" style="max-height:85vh;overflow-y:auto"><div class="subtitle">New Udhaar</div><select id="loanDirection" class="sel"><option value="iLent">I Lent Money</option><option value="iBorrowed">I Borrowed Money</option></select><input class="inp" id="loanPerson" placeholder="Person name" style="margin-top:12px"><input class="inp" id="loanPhone" placeholder="Phone (optional)" style="margin-top:8px"><input class="inp" id="loanAmount" type="number" placeholder="Amount (PKR)" style="margin-top:8px"><div class="small text-secondary" style="margin-top:8px">Date Given</div><input class="inp" type="date" id="loanDateGiven" value="' + new Date().toISOString().slice(0,10) + '"><label style="display:flex;align-items:center;gap:8px;margin-top:8px"><input type="checkbox" id="loanHasDue" onchange="document.getElementById(\'loanDueDate\').style.display=this.checked?\'block\':\'none\'"> Set Due Date</label><input class="inp" type="date" id="loanDueDate" style="display:none;margin-top:4px" value="' + new Date(Date.now()+30*86400000).toISOString().slice(0,10) + '"><input class="inp" id="loanDesc" placeholder="Reason / Note" style="margin-top:8px"><select id="loanBank" class="sel" style="margin-top:8px">' + banks + '</select><button class="btn-primary" style="margin-top:12px" onclick="saveLoan()">Save</button></div></div>';
}

async function saveLoan() {
  var loan = {
    id: uid(), direction: document.getElementById("loanDirection").value,
    personName: document.getElementById("loanPerson").value,
    personPhone: document.getElementById("loanPhone").value || null,
    principalAmount: parseFloat(document.getElementById("loanAmount").value),
    dateGiven: document.getElementById("loanDateGiven").value,
    dueDate: document.getElementById("loanHasDue").checked ? document.getElementById("loanDueDate").value : null,
    loanDescription: document.getElementById("loanDesc").value,
    bankSource: document.getElementById("loanBank").value,
    repayments: [], status: "active", isForgiven: false, createdAt: new Date().toISOString(), reminderEnabled: true
  };
  if (!loan.personName || !loan.principalAmount) return;
  await dbPut("loans", loan);
  closeModal(); await loadAllData(); renderPage();
}

function showRecordRepayment(id) {
  var banks = BANKS.map(function(b) { return '<option value="' + b.key + '">' + b.label + '</option>'; }).join("");
  document.getElementById("modal").innerHTML = '<div class="modal-overlay" onclick="closeModal()"><div class="modal" onclick="event.stopPropagation()"><div class="subtitle">Record Repayment</div><input class="inp" id="repayAmount" type="number" placeholder="Amount (PKR)"><input class="inp" id="repayDate" type="date" value="' + new Date().toISOString().slice(0,10) + '" style="margin-top:8px"><input class="inp" id="repayNote" placeholder="Note (optional)" style="margin-top:8px"><select id="repayBank" class="sel" style="margin-top:8px">' + banks + '</select><button class="btn-primary" style="margin-top:12px" onclick="saveRepayment(\'' + id + '\')">Save</button></div></div>';
}

async function saveRepayment(loanId) {
  var amt = parseFloat(document.getElementById("repayAmount").value);
  if (!amt || amt <= 0) return;
  var l = AppState.loans.find(function(x) { return x.id === loanId; });
  if (!l) return;
  var r = { id: uid(), date: document.getElementById("repayDate").value, amount: amt, note: document.getElementById("repayNote").value || null, bankSource: document.getElementById("repayBank").value };
  l.repayments = l.repayments || [];
  l.repayments.push(r);
  await dbPut("loans", l);
  closeModal(); await loadAllData(); renderPage();
}

async function forgiveLoan(id) {
  if (!confirm("Mark this loan as forgiven?")) return;
  var l = AppState.loans.find(function(x) { return x.id === id; });
  if (!l) return;
  l.isForgiven = true;
  await dbPut("loans", l);
  await loadAllData(); renderPage();
}

function closeModal() { document.getElementById("modal").innerHTML = ""; }/* ============ SETTINGS ============ */
function renderSettings(el) {
  var accRows = BANKS.filter(function(b) { return b.key !== "cash"; }).map(function(b) {
    var acc = AppState.bankAccounts.find(function(a) { return a.bankSource === b.key; });
    return '<div class="row sb" style="margin-top:4px"><span style="color:' + bankColor(b.key) + '">' + b.label + '</span><span>' + (acc ? fmtPKR(acc.currentBalance||0) : "Not connected") + '</span></div>';
  }).join("");

  el.innerHTML = '<div class="title" style="margin-bottom:12px">Settings</div>' +
    '<div class="card"><div class="row sb"><span>Version</span><span class="text-secondary">1.0.0 (PWA)</span></div></div>' +
    '<div class="card" style="margin-top:8px"><div class="row sb"><span>Data Storage</span><span style="color:var(--accent)">On-device only</span></div><div class="small text-secondary" style="margin-top:4px">Your data never leaves this device</div></div>' +
    '<div class="card" style="margin-top:8px"><div class="subtitle">Bank Accounts</div>' + accRows + '</div>' +
    '<div class="card" style="margin-top:8px"><div class="subtitle">Export Data</div><button class="btn-secondary" onclick="exportCSV()">Export as CSV</button></div>' +
    '<div class="card" style="margin-top:8px"><button class="btn-secondary" style="color:var(--danger)" onclick="clearAllData()">Clear All Data</button></div>';
}

function exportCSV() {
  var csv = "Date,Description,Amount,Type,Category,Bank,Balance\n";
  AppState.transactions.forEach(function(t) {
    csv += t.date + ',"' + (t.merchant||t.description) + '",' + t.amount + ',' + t.type + ',' + catLabel(t.category) + ',' + bankLabel(t.bankSource) + ',' + (t.balance||"") + '\n';
  });
  var blob = new Blob([csv], { type: "text/csv" });
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a"); a.href = url; a.download = "hisaabkitaab_export.csv"; a.click();
}

async function clearAllData() {
  if (!confirm("Delete ALL data? This cannot be undone.")) return;
  await Promise.all(["transactions","budgets","savingsGoals","loans","bankAccounts"].map(dbClear));
  await loadAllData(); renderPage();
}

/* ============ ONBOARDING ============ */
function renderOnboarding(el) {
  el.innerHTML = '<div style="text-align:center;padding:20px 0"><div style="font-size:64px;margin-bottom:16px">Money Bag</div><div class="title">Welcome to HisaabKitaab</div><div class="text-secondary">Your personal AI financial manager for Pakistani bank accounts</div><div style="margin:20px 0;text-align:left"><div class="card">Track spending across 5 banks</div><div class="card" style="margin-top:8px">AI-powered spending insights</div><div class="card" style="margin-top:8px">Budget management with alerts</div><div class="card" style="margin-top:8px">Udhaar (loan) tracker</div><div class="card" style="margin-top:8px">100% on-device - no cloud</div><div class="card" style="margin-top:8px">Works completely offline</div></div><div class="row gap-12" style="margin-top:20px"><button class="btn-secondary" onclick="skipOnboarding()">Skip</button><button class="btn-primary" onclick="completeOnboarding()">Get Started</button></div></div>';
}

async function completeOnboarding() {
  await seedDemoData();
  await dbPut("settings", { key: "onboarding", value: true });
  AppState.onboardingCompleted = true;
  AppState.currentScreen = "dashboard";
  renderPage();
}

async function skipOnboarding() {
  await seedDemoData();
  await dbPut("settings", { key: "onboarding", value: true });
  AppState.onboardingCompleted = true;
  AppState.currentScreen = "dashboard";
  renderPage();
}/* ============ CHARTS (Canvas) ============ */
function drawBarChart(canvasId, labels, values, color) {
  var canvas = document.getElementById(canvasId);
  if (!canvas) return;
  var ctx = canvas.getContext("2d");
  canvas.width = Math.max(canvas.parentElement.clientWidth - 32, 200);
  var w = canvas.width, h = canvas.height;
  var max = Math.max.apply(null, values.concat([1]));
  var barW = w / labels.length * 0.6;
  var gap = w / labels.length * 0.4;

  ctx.clearRect(0, 0, w, h);
  values.forEach(function(v, i) {
    var x = i * (barW + gap) + gap/2;
    var bh = (v / max) * (h - 30);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x, h - bh - 20, barW, bh, 4);
    ctx.fill();
    ctx.fillStyle = "#8892A4";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(labels[i], x + barW/2, h - 4);
    if (v > 0) {
      ctx.fillStyle = "#fff";
      ctx.font = "9px sans-serif";
      ctx.fillText(fmtPKR(v, true), x + barW/2, h - bh - 24);
    }
  });
}

function drawDonutChart(canvasId, data) {
  var canvas = document.getElementById(canvasId);
  if (!canvas || !data.length) return;
  var ctx = canvas.getContext("2d");
  canvas.width = Math.min(canvas.parentElement.clientWidth - 32, 300);
  var w = canvas.width, h = canvas.height;
  var cx = w / 2, cy = h / 2;
  var radius = Math.min(cx, cy) - 10;
  var total = data.reduce(function(s, e) { return s + e[1]; }, 0);

  ctx.clearRect(0, 0, w, h);
  var angle = -Math.PI / 2;
  data.forEach(function(e) {
    var key = e[0], value = e[1];
    var slice = (value / total) * Math.PI * 2;
    ctx.fillStyle = catColor(key);
    ctx.beginPath();
    ctx.arc(cx, cy, radius, angle, angle + slice);
    ctx.lineTo(cx, cy);
    ctx.fill();
    angle += slice;
  });
  ctx.fillStyle = "#0A0E1A";
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.6, 0, Math.PI * 2);
  ctx.fill();

  var ly = 16;
  data.forEach(function(e) {
    var key = e[0];
    ctx.fillStyle = catColor(key);
    ctx.fillRect(8, ly, 10, 10);
    ctx.fillStyle = "#8892A4";
    ctx.font = "11px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(catLabel(key), 24, ly + 10);
    ly += 18;
  });
}

function drawUdhaarChart() {
  var canvas = document.getElementById("udhaarChart");
  if (!canvas) return;
  var overdue0_30 = AppState.loans.filter(function(l) { return l.isOverdue && (new Date()-new Date(l.dueDate))/86400000 <= 30; }).reduce(function(s,l){return s+(l.remainingAmount||0);},0);
  var overdue31_60 = AppState.loans.filter(function(l) { return l.isOverdue && (new Date()-new Date(l.dueDate))/86400000 > 30 && (new Date()-new Date(l.dueDate))/86400000 <= 60; }).reduce(function(s,l){return s+(l.remainingAmount||0);},0);
  var overdue60p = AppState.loans.filter(function(l) { return l.isOverdue && (new Date()-new Date(l.dueDate))/86400000 > 60; }).reduce(function(s,l){return s+(l.remainingAmount||0);},0);
  drawBarChart("udhaarChart", ["0-30 days","31-60 days","60+ days"], [overdue0_30, overdue31_60, overdue60p], "#FFD700");
}/* ============ SEED DATA ============ */
async function seedDemoData() {
  var now = new Date();
  var sampleTxns = [
    [0, 2500, "debit", "Foodpanda Order", "Foodpanda", "food", "sadapay"],
    [0, 850, "debit", "Careem Ride", "Careem", "transport", "easypaisa"],
    [1, 45000, "credit", "Salary Deposit", "Employer", "income", "meezanBank"],
    [1, 5000, "debit", "LESCO Bill", "LESCO", "utilities", "meezanBank"],
    [1, 1200, "debit", "Jazz Package", "Jazz", "mobileTopup", "jazzCash"],
    [2, 3500, "debit", "Daraz Shopping", "Daraz", "shopping", "sadapay"],
    [2, 1800, "debit", "KFC Dinner", "KFC", "food", "naypay"],
    [3, 15000, "debit", "Rent Payment", "Landlord", "utilities", "meezanBank"],
    [4, 3200, "debit", "Imtiaz Grocery", "Imtiaz", "food", "sadapay"],
    [5, 800, "debit", "Zong Recharge", "Zong", "mobileTopup", "jazzCash"],
    [6, 4200, "debit", "Hospital Visit", "Aga Khan", "health", "meezanBank"],
    [7, 1500, "debit", "Netflix", "Netflix", "entertainment", "sadapay"],
    [8, 12000, "credit", "Freelance Payment", "Upwork", "income", "sadapay"],
    [9, 3000, "debit", "Fuel PSO", "PSO", "transport", "easypaisa"],
    [10, 950, "debit", "Careem Food", "Careem", "food", "sadapay"],
    [12, 2800, "debit", "Coursera", "Coursera", "education", "sadapay"],
    [15, 1700, "debit", "Cinema", "Cinepax", "entertainment", "naypay"],
    [18, 900, "debit", "Bykea Ride", "Bykea", "transport", "easypaisa"],
    [20, 3500, "debit", "SSGC Bill", "SSGC", "utilities", "meezanBank"],
    [22, 4200, "debit", "Restaurant", "Kolachi", "food", "sadapay"],
    [25, 1000, "debit", "Telenor Load", "Telenor", "mobileTopup", "jazzCash"],
    [27, 7500, "credit", "Eidi Received", "Family", "income", "cash"],
    [30, 3200, "debit", "Indrive Ride", "inDrive", "transport", "naypay"],
    [32, 1800, "debit", "Foodpanda", "Foodpanda", "food", "easypaisa"],
    [35, 8000, "debit", "Shopping", "Imtiaz", "shopping", "meezanBank"],
    [40, 4500, "debit", "Car Repair", "Workshop", "transport", "easypaisa"]
  ];

  for (var i = 0; i < sampleTxns.length; i++) {
    var r = sampleTxns[i];
    var d = new Date(now); d.setDate(d.getDate() - r[0]);
    var bal = Math.random() * 100000 + 30000;
    await dbPut("transactions", new Transaction({
      date: d.toISOString(), amount: r[1], type: r[2], description: r[3],
      merchant: r[4], category: r[5], bankSource: r[6], balance: bal
    }));
  }

  var accounts = [
    { bankSource: "meezanBank", accountName: "Meezan Bank", currentBalance: 125000 },
    { bankSource: "easypaisa", accountName: "EasyPaisa", currentBalance: 35000 },
    { bankSource: "sadapay", accountName: "SadaPay", currentBalance: 18000 },
    { bankSource: "naypay", accountName: "NayaPay", currentBalance: 22000 },
    { bankSource: "jazzCash", accountName: "JazzCash", currentBalance: 8500 }
  ];
  for (var j = 0; j < accounts.length; j++) {
    accounts[j].id = uid();
    await dbPut("bankAccounts", accounts[j]);
  }

  var budgets = [
    { category: "food", monthlyLimit: 25000 }, { category: "transport", monthlyLimit: 10000 },
    { category: "utilities", monthlyLimit: 20000 }, { category: "shopping", monthlyLimit: 15000 },
    { category: "entertainment", monthlyLimit: 5000 }, { category: "mobileTopup", monthlyLimit: 3000 }
  ];
  for (var k = 0; k < budgets.length; k++) {
    budgets[k].id = uid(); budgets[k].rolloverEnabled = false; budgets[k].createdAt = now.toISOString();
    await dbPut("budgets", budgets[k]);
  }

  var goals = [
    { name: "Eid Fund", targetAmount: 50000, currentAmount: 25000 },
    { name: "New Phone", targetAmount: 150000, currentAmount: 45000 },
    { name: "Emergency Fund", targetAmount: 200000, currentAmount: 80000 }
  ];
  for (var g = 0; g < goals.length; g++) {
    await dbPut("savingsGoals", { id: uid(), name: goals[g].name, targetAmount: goals[g].targetAmount, currentAmount: goals[g].currentAmount, createdAt: now.toISOString(), isCompleted: false });
  }

  var past = new Date(now); past.setDate(past.getDate() - 45);
  var future = new Date(now); future.setDate(future.getDate() + 7);
  var pastDue = new Date(now); pastDue.setDate(pastDue.getDate() - 30);
  var loans = [
    { direction: "iLent", personName: "Bilal Ahmed", personPhone: "03001234567", principalAmount: 8000, dateGiven: past.toISOString(), dueDate: future.toISOString(), loanDescription: "Helped with bike repair", bankSource: "easypaisa", repayments: [{ id: uid(), date: new Date(now.getTime()-20*86400000).toISOString(), amount: 2000, note: "Partial via EasyPaisa" }], status: "partiallyPaid", isForgiven: false },
    { direction: "iBorrowed", personName: "Ammi Jan", principalAmount: 15000, dateGiven: new Date(now.getTime()-60*86400000).toISOString(), dueDate: null, loanDescription: "Eid clothes advance", bankSource: "cash", repayments: [], status: "active", isForgiven: false },
    { direction: "iLent", personName: "Usman Tariq", principalAmount: 3000, dateGiven: new Date(now.getTime()-90*86400000).toISOString(), dueDate: pastDue.toISOString(), loanDescription: "University fees", bankSource: "jazzCash", repayments: [], status: "overdue", isForgiven: false },
    { direction: "iLent", personName: "Sara Malik", principalAmount: 5000, dateGiven: new Date(now.getTime()-120*86400000).toISOString(), loanDescription: "Medical emergency", bankSource: "easypaisa", repayments: [{ id: uid(), date: new Date(now.getTime()-90*86400000).toISOString(), amount: 5000, note: "Full repayment" }], status: "fullyRepaid", isForgiven: false }
  ];
  for (var l = 0; l < loans.length; l++) {
    loans[l].id = uid(); loans[l].createdAt = now.toISOString(); loans[l].reminderEnabled = true;
    await dbPut("loans", loans[l]);
  }
}

/* ============ INIT ============ */
async function initApp() {
  var el = document.getElementById("content");
  el.innerHTML = '<div style="padding:60px 20px;text-align:center"><div class="spinner" style="margin:0 auto 16px"></div><div class="text-secondary">Setting up your vault...</div></div>';

  var dbTimeout = new Promise(function(_, reject) {
    setTimeout(function() { reject(new Error("Database timeout")); }, 10000);
  });

  try {
    await Promise.race([openDB(), dbTimeout]);
  } catch(e) {
    el.innerHTML = '<div style="padding:40px;text-align:center"><h2 style="color:var(--danger)">Database Error</h2><p class="text-secondary">' + e.message + '</p><button class="btn-primary" style="margin-top:16px" onclick="location.reload()">Retry</button></div>';
    return;
  }

  try {
    var settings = await dbGet("settings", "onboarding");
    if (!settings) {
      AppState.currentScreen = "onboarding";
      renderPage();
      return;
    }
    AppState.onboardingCompleted = true;
    await loadAllData();
    AppState.currentScreen = "dashboard";
    renderPage();
  } catch(e) {
    el.innerHTML = '<div style="padding:40px;text-align:center"><h2 style="color:var(--danger)">Startup Error</h2><p class="text-secondary">' + e.message + '</p><button class="btn-primary" style="margin-top:16px" onclick="location.reload()">Retry</button></div>';
  }
}

document.addEventListener("DOMContentLoaded", function() {
  try { initApp(); } catch(e) {
    document.getElementById("content").innerHTML = '<div style="padding:40px;text-align:center"><h2 style="color:var(--danger)">Critical Error</h2><p class="text-secondary">' + e.message + '</p></div>';
  }
});

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js").catch(function(){});
}