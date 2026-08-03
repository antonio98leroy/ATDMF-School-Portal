import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AccountBalance,
  Add,
  AttachMoney,
  CheckCircle,
  Description,
  Groups,
  Payments,
  PendingActions,
  Refresh,
  Savings,
  Search,
  Verified,
} from "@mui/icons-material";

import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import { FinanceAPI } from "../api/finance";


function normalizeList(response) {
  if (Array.isArray(response?.data)) {
    return response.data;
  }

  return response?.data?.results || [];
}


function getErrorMessage(error) {
  const data = error?.response?.data;

  if (!data) {
    return "An unexpected error occurred.";
  }

  if (typeof data === "string") {
    return data;
  }

  if (data.detail) {
    return data.detail;
  }

  return Object.entries(data)
    .map(([field, value]) => {
      const message = Array.isArray(value)
        ? value.join(" ")
        : String(value);

      return `${field.replaceAll("_", " ")}: ${message}`;
    })
    .join(" ");
}


function formatMoney(value, currency = "LRD") {
  const amount = Number(value || 0);

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}


function formatDate(value) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleDateString();
}


function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function printOfficialReceipt(data) {
  const school = data?.school || {};
  const receipt = data?.receipt || {};

  const amount = Number(
    receipt.amount || 0
  ).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const printWindow = window.open(
    "",
    "_blank",
    "width=850,height=900"
  );

  if (!printWindow) {
    throw new Error(
      "The receipt window was blocked. Allow pop-ups and try again."
    );
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>${escapeHtml(
          receipt.receipt_number || "Official Receipt"
        )}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 30px; color: #111827; }
          .receipt { max-width: 760px; margin: auto; border: 2px solid #0B2A78; padding: 30px; }
          .header { text-align: center; border-bottom: 2px solid #0B2A78; padding-bottom: 18px; margin-bottom: 25px; }
          .school { font-size: 24px; font-weight: 800; color: #0B2A78; }
          .title { margin-top: 8px; font-size: 19px; font-weight: 700; color: #C8102E; }
          .row { display: flex; justify-content: space-between; gap: 30px; padding: 10px 0; border-bottom: 1px solid #E5E7EB; }
          .label { font-weight: 700; color: #374151; }
          .value { text-align: right; font-weight: 600; }
          .amount { margin: 25px 0; padding: 20px; background: #F3F6FF; border: 1px solid #0B2A78; text-align: center; }
          .amount-label { font-size: 14px; }
          .amount-value { font-size: 30px; font-weight: 900; color: #0B2A78; }
          .signatures { display: flex; justify-content: space-between; margin-top: 70px; gap: 40px; }
          .signature { flex: 1; border-top: 1px solid #111827; padding-top: 8px; text-align: center; }
          .footer { margin-top: 35px; text-align: center; color: #6B7280; font-size: 12px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <div class="school">${escapeHtml(
              school.name || "Annie T. Doe Memorial Foundation High School"
            )}</div>
            <div class="title">${escapeHtml(
              school.document_title || "Official Receipt"
            )}</div>
          </div>
          <div class="row"><span class="label">Receipt Number</span><span class="value">${escapeHtml(receipt.receipt_number)}</span></div>
          <div class="row"><span class="label">Student Name</span><span class="value">${escapeHtml(receipt.student_name)}</span></div>
          <div class="row"><span class="label">Admission Number</span><span class="value">${escapeHtml(receipt.admission_number)}</span></div>
          <div class="row"><span class="label">Invoice Number</span><span class="value">${escapeHtml(receipt.invoice_number)}</span></div>
          <div class="row"><span class="label">Bank Slip Number</span><span class="value">${escapeHtml(receipt.bank_slip_number || "—")}</span></div>
          <div class="row"><span class="label">Academic Year</span><span class="value">${escapeHtml(receipt.academic_year)}</span></div>
          <div class="row"><span class="label">Term</span><span class="value">${escapeHtml(receipt.term)}</span></div>
          <div class="row"><span class="label">Payment Method</span><span class="value">${escapeHtml(receipt.method)}</span></div>
          <div class="row"><span class="label">Payment Date</span><span class="value">${escapeHtml(receipt.payment_date ? new Date(receipt.payment_date).toLocaleDateString() : "")}</span></div>
          <div class="amount"><div class="amount-label">Amount Received</div><div class="amount-value">L$ ${amount}</div></div>
          <div class="row"><span class="label">Received By</span><span class="value">${escapeHtml(receipt.received_by)}</span></div>
          <div class="signatures"><div class="signature">Registrar Signature</div><div class="signature">School Stamp</div></div>
          <div class="footer">This is an official system-generated receipt. Keep it for your records.</div>
        </div>
        <script>window.onload = function () { window.print(); };</script>
      </body>
    </html>
  `);

  printWindow.document.close();
}


const verificationColors = {
  PENDING: "warning",
  VERIFIED: "success",
  REJECTED: "error",
  RECONCILED: "primary",
};


const fundingColors = {
  SPONSORED: "success",
  PARTIALLY_SPONSORED: "warning",
  UNSPONSORED: "error",
};


export default function Finance() {
  const [tab, setTab] = useState(0);

  const [dashboard, setDashboard] = useState({});
  const [depositSummary, setDepositSummary] =
    useState({});

  const [students, setStudents] = useState([]);
  const [academicYears, setAcademicYears] =
    useState([]);
  const [terms, setTerms] = useState([]);
  const [sponsors, setSponsors] = useState([]);
  const [sponsorships, setSponsorships] =
    useState([]);
  const [bankAccounts, setBankAccounts] =
    useState([]);
  const [bankDeposits, setBankDeposits] =
    useState([]);
  const [bankStatements, setBankStatements] =
    useState([]);
  const [selectedStatement, setSelectedStatement] =
    useState(null);
  const [statementTransactions, setStatementTransactions] =
    useState([]);
  const [statementDialogOpen, setStatementDialogOpen] =
    useState(false);
  const [transactionDialogOpen, setTransactionDialogOpen] =
    useState(false);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [expenseCategories, setExpenseCategories] =
    useState([]);
  const [expenses, setExpenses] = useState([]);
  const [unsponsoredStudents, setUnsponsoredStudents] =
    useState([]);
  const [outstandingStudents, setOutstandingStudents] =
    useState([]);

  const [selectedAcademicYear, setSelectedAcademicYear] =
    useState("");

  const [loading, setLoading] = useState(true);
  const [sectionLoading, setSectionLoading] =
    useState(false);

  const [error, setError] = useState("");

  const [sponsorDialogOpen, setSponsorDialogOpen] =
    useState(false);

  const [
    sponsorshipDialogOpen,
    setSponsorshipDialogOpen,
  ] = useState(false);

  const [bankAccountDialogOpen, setBankAccountDialogOpen] =
    useState(false);

  const [depositDialogOpen, setDepositDialogOpen] =
    useState(false);

  const [expenseDialogOpen, setExpenseDialogOpen] =
    useState(false);

  const [
    expenseCategoryDialogOpen,
    setExpenseCategoryDialogOpen,
  ] = useState(false);

  const [rejectDialog, setRejectDialog] = useState({
    open: false,
    deposit: null,
    reason: "",
  });

  const [submitting, setSubmitting] = useState(false);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const showMessage = (
    message,
    severity = "success"
  ) => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  };

  const activeYear = useMemo(
    () =>
      academicYears.find(
        (item) =>
          String(item.id) ===
          String(selectedAcademicYear)
      ),
    [academicYears, selectedAcademicYear]
  );

  const filteredTerms = useMemo(() => {
    if (!selectedAcademicYear) {
      return terms;
    }

    return terms.filter(
      (item) =>
        String(item.academic_year) ===
        String(selectedAcademicYear)
    );
  }, [terms, selectedAcademicYear]);

  const loadReferenceData = useCallback(async () => {
    const [
      studentsResponse,
      yearsResponse,
      termsResponse,
      sponsorsResponse,
      bankAccountsResponse,
      categoriesResponse,
    ] = await Promise.all([
      FinanceAPI.getStudents({
        page_size: 1000,
        ordering: "last_name",
      }),
      FinanceAPI.getAcademicYears({
        page_size: 100,
      }),
      FinanceAPI.getTerms({
        page_size: 200,
      }),
      FinanceAPI.getSponsors({
        page_size: 500,
      }),
      FinanceAPI.getBankAccounts({
        page_size: 100,
      }),
      FinanceAPI.getExpenseCategories({
        page_size: 500,
      }),
    ]);

    const years = normalizeList(yearsResponse);

    setStudents(normalizeList(studentsResponse));
    setAcademicYears(years);
    setTerms(normalizeList(termsResponse));
    setSponsors(normalizeList(sponsorsResponse));
    setBankAccounts(
      normalizeList(bankAccountsResponse)
    );
    setExpenseCategories(
      normalizeList(categoriesResponse)
    );

    if (!selectedAcademicYear) {
      const active = years.find(
        (item) => item.active
      );

      if (active) {
        setSelectedAcademicYear(active.id);
      } else if (years.length > 0) {
        setSelectedAcademicYear(years[0].id);
      }
    }
  }, [selectedAcademicYear]);

  const loadFinanceData = useCallback(
    async (academicYear = selectedAcademicYear) => {
      const params = academicYear
        ? {
            academic_year: academicYear,
          }
        : {};

      const [
        dashboardResponse,
        summaryResponse,
        sponsorshipResponse,
        depositResponse,
        statementResponse,
        invoiceResponse,
        paymentResponse,
        expenseResponse,
        unsponsoredResponse,
        outstandingResponse,
      ] = await Promise.all([
        FinanceAPI.getDashboard(params),
        FinanceAPI.getBankDepositSummary(params),
        FinanceAPI.getSponsorships({
          ...params,
          page_size: 1000,
        }),
        FinanceAPI.getBankDeposits({
          ...params,
          page_size: 1000,
          ordering: "-payment_date",
        }),
        FinanceAPI.getBankStatements({
          page_size: 500,
          ordering: "-week_end_date",
        }),
        FinanceAPI.getInvoices({
          ...params,
          page_size: 1000,
          ordering: "-created_at",
        }),
        FinanceAPI.getPayments({
          ...params,
          page_size: 1000,
          ordering: "-paid_at",
        }),
        FinanceAPI.getExpenses({
          page_size: 1000,
          ordering: "-date",
        }),
        FinanceAPI.getUnsponsoredReport(params),
        FinanceAPI.getOutstandingStudents(params),
      ]);

      setDashboard(dashboardResponse.data || {});
      setDepositSummary(summaryResponse.data || {});
      setSponsorships(
        normalizeList(sponsorshipResponse)
      );
      setBankDeposits(normalizeList(depositResponse));
      setBankStatements(normalizeList(statementResponse));
      setInvoices(normalizeList(invoiceResponse));
      setPayments(normalizeList(paymentResponse));
      setExpenses(normalizeList(expenseResponse));
      setUnsponsoredStudents(
        Array.isArray(unsponsoredResponse.data)
          ? unsponsoredResponse.data
          : []
      );
      setOutstandingStudents(
        Array.isArray(outstandingResponse.data)
          ? outstandingResponse.data
          : []
      );
    },
    [selectedAcademicYear]
  );

  const initialize = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      await loadReferenceData();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [loadReferenceData]);

  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    if (!selectedAcademicYear) {
      return;
    }

    const load = async () => {
      setSectionLoading(true);
      setError("");

      try {
        await loadFinanceData(
          selectedAcademicYear
        );
      } catch (requestError) {
        setError(getErrorMessage(requestError));
      } finally {
        setSectionLoading(false);
      }
    };

    load();
  }, [selectedAcademicYear]);

  const refreshAll = async () => {
    setSectionLoading(true);
    setError("");

    try {
      await Promise.all([
        loadReferenceData(),
        loadFinanceData(),
      ]);

      showMessage(
        "Finance records refreshed successfully."
      );
    } catch (requestError) {
      showMessage(
        getErrorMessage(requestError),
        "error"
      );
    } finally {
      setSectionLoading(false);
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Box sx={{ pb: 5 }}>
      <Stack spacing={3}>
        <Stack
          direction={{
            xs: "column",
            md: "row",
          }}
          spacing={2}
          sx={{
            justifyContent: "space-between",
            alignItems: {
              xs: "stretch",
              md: "center",
            },
          }}
        >
          <Box>
            <Typography
              variant="h4"
              sx={{
                color: "#0B2A78",
                fontWeight: 900,
              }}
            >
              Finance & Sponsorship
            </Typography>

            <Typography color="text.secondary">
              Manage student sponsorship, LBDI bank
              slips, payments, expenses, and financial
              reports.
            </Typography>
          </Box>

          <Stack
            direction={{
              xs: "column",
              sm: "row",
            }}
            spacing={1}
          >
            <FormControl
              size="small"
              sx={{ minWidth: 190 }}
            >
              <InputLabel>
                Academic Year
              </InputLabel>

              <Select
                label="Academic Year"
                value={selectedAcademicYear}
                onChange={(event) =>
                  setSelectedAcademicYear(
                    event.target.value
                  )
                }
              >
                {academicYears.map((year) => (
                  <MenuItem
                    key={year.id}
                    value={year.id}
                  >
                    {year.name}
                    {year.active
                      ? " — Active"
                      : ""}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button
              variant="outlined"
              startIcon={<Refresh />}
              disabled={sectionLoading}
              onClick={refreshAll}
            >
              Refresh
            </Button>
          </Stack>
        </Stack>

        {error && (
          <Alert severity="error">
            {error}
          </Alert>
        )}

        <Tabs
          value={tab}
          onChange={(event, value) =>
            setTab(value)
          }
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Dashboard" />
          <Tab label="Sponsorships" />
          <Tab label="Bank Deposits" />
          <Tab label="Weekly Statements" />
          <Tab label="Payments & Receipts" />
          <Tab label="Expenses" />
          <Tab label="Reports" />
        </Tabs>

        {sectionLoading && (
          <Paper
            variant="outlined"
            sx={{
              p: 1.5,
              borderRadius: 2,
            }}
          >
            <Stack
              direction="row"
              spacing={1.5}
              sx={{ alignItems: "center" }}
            >
              <CircularProgress size={20} />

              <Typography color="text.secondary">
                Updating finance information...
              </Typography>
            </Stack>
          </Paper>
        )}

        {tab === 0 && (
          <FinanceDashboard
            dashboard={dashboard}
            depositSummary={depositSummary}
            sponsorships={sponsorships}
            recentDeposits={bankDeposits.slice(0, 8)}
            activeYear={activeYear}
          />
        )}

        {tab === 1 && (
          <SponsorshipSection
            sponsorships={sponsorships}
            sponsors={sponsors}
            onAddSponsor={() =>
              setSponsorDialogOpen(true)
            }
            onAddSponsorship={() =>
              setSponsorshipDialogOpen(true)
            }
          />
        )}

        {tab === 2 && (
          <BankDepositSection
            deposits={bankDeposits}
            summary={depositSummary}
            onAddBankAccount={() =>
              setBankAccountDialogOpen(true)
            }
            onAddDeposit={() =>
              setDepositDialogOpen(true)
            }
            onVerify={async (deposit) => {
              setSubmitting(true);

              try {
                await FinanceAPI.verifyBankDeposit(
                  deposit.id
                );

                showMessage(
                  "Bank deposit verified and payment receipt created."
                );

                await loadFinanceData();
              } catch (requestError) {
                showMessage(
                  getErrorMessage(requestError),
                  "error"
                );
              } finally {
                setSubmitting(false);
              }
            }}
            onReject={(deposit) =>
              setRejectDialog({
                open: true,
                deposit,
                reason: "",
              })
            }
            onReconcile={async (deposit) => {
              setSubmitting(true);

              try {
                await FinanceAPI.reconcileBankDeposit(
                  deposit.id
                );

                showMessage(
                  "Bank deposit reconciled successfully."
                );

                await loadFinanceData();
              } catch (requestError) {
                showMessage(
                  getErrorMessage(requestError),
                  "error"
                );
              } finally {
                setSubmitting(false);
              }
            }}
            submitting={submitting}
          />
        )}

        {tab === 3 && (
          <WeeklyStatementsSection
            statements={bankStatements}
            onUpload={() =>
              setStatementDialogOpen(true)
            }
            onViewTransactions={async (statement) => {
              try {
                const response =
                  await FinanceAPI.getStatementTransactions({
                    statement: statement.id,
                    page_size: 2000,
                  });

                setSelectedStatement(statement);
                setStatementTransactions(
                  normalizeList(response)
                );
                setTransactionDialogOpen(true);
              } catch (requestError) {
                showMessage(
                  getErrorMessage(requestError),
                  "error"
                );
              }
            }}
            onAutoMatch={async (statement) => {
              setSubmitting(true);

              try {
                const response =
                  await FinanceAPI.autoMatchBankStatement(
                    statement.id
                  );

                showMessage(
                  `Matching completed: ${
                    response.data.matched || 0
                  } matched, ${
                    response.data.unmatched || 0
                  } unmatched, and ${
                    response.data.duplicates || 0
                  } duplicates.`
                );

                await loadFinanceData();
              } catch (requestError) {
                showMessage(
                  getErrorMessage(requestError),
                  "error"
                );
              } finally {
                setSubmitting(false);
              }
            }}
            submitting={submitting}
          />
        )}

        {tab === 4 && (
          <PaymentsSection
            payments={payments}
            onPrintReceipt={async (payment) => {
              try {
                const response =
                  await FinanceAPI.getOfficialReceipt(
                    payment.id
                  );

                printOfficialReceipt(response.data);

                await FinanceAPI.markReceiptPrinted(
                  payment.id
                );

                await loadFinanceData();

                showMessage(
                  "Official receipt opened for printing."
                );
              } catch (requestError) {
                showMessage(
                  getErrorMessage(requestError),
                  "error"
                );
              }
            }}
          />
        )}

        {tab === 5 && (
          <ExpensesSection
            expenses={expenses}
            onAddExpense={() =>
              setExpenseDialogOpen(true)
            }
            onAddCategory={() =>
              setExpenseCategoryDialogOpen(true)
            }
            onApprove={async (expense) => {
              try {
                await FinanceAPI.approveExpenses([
                  expense.id,
                ]);

                showMessage(
                  "Expense approved successfully."
                );

                await loadFinanceData();
              } catch (requestError) {
                showMessage(
                  getErrorMessage(requestError),
                  "error"
                );
              }
            }}
          />
        )}

        {tab === 6 && (
          <ReportsSection
            unsponsoredStudents={
              unsponsoredStudents
            }
            outstandingStudents={
              outstandingStudents
            }
          />
        )}
      </Stack>

      <SponsorDialog
        open={sponsorDialogOpen}
        onClose={() =>
          setSponsorDialogOpen(false)
        }
        onSaved={async () => {
          setSponsorDialogOpen(false);
          await loadReferenceData();
          showMessage("Sponsor created successfully.");
        }}
        showMessage={showMessage}
      />

      <SponsorshipDialog
        open={sponsorshipDialogOpen}
        onClose={() =>
          setSponsorshipDialogOpen(false)
        }
        students={students}
        sponsors={sponsors}
        academicYears={academicYears}
        defaultYear={selectedAcademicYear}
        onSaved={async () => {
          setSponsorshipDialogOpen(false);
          await loadFinanceData();
          showMessage(
            "Student sponsorship record saved."
          );
        }}
        showMessage={showMessage}
      />

      <BankAccountDialog
        open={bankAccountDialogOpen}
        onClose={() =>
          setBankAccountDialogOpen(false)
        }
        onSaved={async () => {
          setBankAccountDialogOpen(false);
          await loadReferenceData();
          showMessage(
            "Bank account created successfully."
          );
        }}
        showMessage={showMessage}
      />

      <BankDepositDialog
        open={depositDialogOpen}
        onClose={() =>
          setDepositDialogOpen(false)
        }
        students={students}
        academicYears={academicYears}
        terms={filteredTerms}
        invoices={invoices}
        bankAccounts={bankAccounts}
        sponsorships={sponsorships}
        defaultYear={selectedAcademicYear}
        onSaved={async () => {
          setDepositDialogOpen(false);
          await loadFinanceData();
          showMessage(
            "Bank slip recorded as pending verification."
          );
        }}
        showMessage={showMessage}
      />

      <BankStatementDialog
        open={statementDialogOpen}
        onClose={() =>
          setStatementDialogOpen(false)
        }
        bankAccounts={bankAccounts}
        onSaved={async () => {
          setStatementDialogOpen(false);
          await loadFinanceData();
          showMessage(
            "Weekly bank statement uploaded successfully."
          );
        }}
        showMessage={showMessage}
      />

      <StatementTransactionsDialog
        open={transactionDialogOpen}
        onClose={() => {
          setTransactionDialogOpen(false);
          setSelectedStatement(null);
          setStatementTransactions([]);
        }}
        statement={selectedStatement}
        transactions={statementTransactions}
      />

      <ExpenseCategoryDialog
        open={expenseCategoryDialogOpen}
        onClose={() =>
          setExpenseCategoryDialogOpen(false)
        }
        onSaved={async () => {
          setExpenseCategoryDialogOpen(false);
          await loadReferenceData();
          showMessage(
            "Expense category created successfully."
          );
        }}
        showMessage={showMessage}
      />

      <ExpenseDialog
        open={expenseDialogOpen}
        onClose={() =>
          setExpenseDialogOpen(false)
        }
        categories={expenseCategories}
        onSaved={async () => {
          setExpenseDialogOpen(false);
          await loadFinanceData();
          showMessage(
            "Expense recorded successfully."
          );
        }}
        showMessage={showMessage}
      />

      <Dialog
        open={rejectDialog.open}
        onClose={() =>
          setRejectDialog({
            open: false,
            deposit: null,
            reason: "",
          })
        }
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          Reject Bank Deposit
        </DialogTitle>

        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This will reject bank slip{" "}
            <strong>
              {
                rejectDialog.deposit
                  ?.bank_slip_number
              }
            </strong>
            .
          </Alert>

          <TextField
            fullWidth
            multiline
            minRows={3}
            label="Rejection reason"
            value={rejectDialog.reason}
            onChange={(event) =>
              setRejectDialog((current) => ({
                ...current,
                reason: event.target.value,
              }))
            }
          />
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() =>
              setRejectDialog({
                open: false,
                deposit: null,
                reason: "",
              })
            }
          >
            Cancel
          </Button>

          <Button
            color="error"
            variant="contained"
            disabled={
              !rejectDialog.reason.trim() ||
              submitting
            }
            onClick={async () => {
              setSubmitting(true);

              try {
                await FinanceAPI.rejectBankDeposit(
                  rejectDialog.deposit.id,
                  rejectDialog.reason
                );

                setRejectDialog({
                  open: false,
                  deposit: null,
                  reason: "",
                });

                showMessage(
                  "Bank deposit rejected.",
                  "success"
                );

                await loadFinanceData();
              } catch (requestError) {
                showMessage(
                  getErrorMessage(requestError),
                  "error"
                );
              } finally {
                setSubmitting(false);
              }
            }}
          >
            Reject Deposit
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        onClose={() =>
          setSnackbar((current) => ({
            ...current,
            open: false,
          }))
        }
      >
        <Alert
          variant="filled"
          severity={snackbar.severity}
          onClose={() =>
            setSnackbar((current) => ({
              ...current,
              open: false,
            }))
          }
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}


function FinanceDashboard({
  dashboard,
  depositSummary,
  sponsorships,
  recentDeposits,
  activeYear,
}) {
  const sponsored = sponsorships.filter(
    (item) =>
      item.funding_status === "SPONSORED"
  ).length;

  const partiallySponsored = sponsorships.filter(
    (item) =>
      item.funding_status ===
      "PARTIALLY_SPONSORED"
  ).length;

  const unsponsored = sponsorships.filter(
    (item) =>
      item.funding_status === "UNSPONSORED"
  ).length;

  return (
    <Stack spacing={3}>
      <Alert severity="info">
        This school is tuition-free. Finance records
        represent registration costs, student-benefit
        costs, sponsorship contributions, LBDI bank
        deposits, and school expenses.
      </Alert>

      <Grid container spacing={2}>
        <DashboardCard
          title="Sponsored Students"
          value={sponsored}
          icon={<Savings />}
        />

        <DashboardCard
          title="Partially Sponsored"
          value={partiallySponsored}
          icon={<Groups />}
        />

        <DashboardCard
          title="Unsponsored Students"
          value={unsponsored}
          icon={<Groups />}
        />

        <DashboardCard
          title="Pending Deposits"
          value={depositSummary.pending || 0}
          icon={<PendingActions />}
        />

        <DashboardCard
          title="Verified Deposits"
          value={depositSummary.verified || 0}
          icon={<Verified />}
        />

        <DashboardCard
          title="Reconciled Deposits"
          value={depositSummary.reconciled || 0}
          icon={<CheckCircle />}
        />

        <DashboardCard
          title="Total Collected"
          value={formatMoney(
            dashboard.collected,
            "LRD"
          )}
          icon={<Payments />}
        />

        <DashboardCard
          title="Pending Bank Amount"
          value={formatMoney(
            dashboard.pending_bank_amount,
            "LRD"
          )}
          icon={<AccountBalance />}
        />

        <DashboardCard
          title="Outstanding Costs"
          value={formatMoney(
            dashboard.outstanding,
            "LRD"
          )}
          icon={<AttachMoney />}
        />

        <DashboardCard
          title="Approved Expenses"
          value={formatMoney(
            dashboard.expenses,
            "LRD"
          )}
          icon={<Description />}
        />
      </Grid>

      <Paper
        variant="outlined"
        sx={{
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography
            variant="h6"
            fontWeight={800}
            color="#0B2A78"
          >
            Recent LBDI Bank-Slip Records
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
          >
            Academic year:{" "}
            {activeYear?.name || "Not selected"}
          </Typography>
        </Box>

        <BankDepositTable
          deposits={recentDeposits}
          compact
        />
      </Paper>
    </Stack>
  );
}


function DashboardCard({
  title,
  value,
  icon,
}) {
  return (
    <Grid
      size={{
        xs: 12,
        sm: 6,
        lg: 3,
      }}
    >
      <Paper
        variant="outlined"
        sx={{
          p: 2.5,
          borderRadius: 3,
          height: "100%",
        }}
      >
        <Stack
          direction="row"
          spacing={2}
          sx={{
            alignItems: "center",
          }}
        >
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              display: "grid",
              placeItems: "center",
              bgcolor: "#E8EEFF",
              color: "#0B2A78",
            }}
          >
            {icon}
          </Box>

          <Box>
            <Typography
              variant="body2"
              color="text.secondary"
            >
              {title}
            </Typography>

            <Typography
              variant="h6"
              fontWeight={900}
            >
              {value}
            </Typography>
          </Box>
        </Stack>
      </Paper>
    </Grid>
  );
}


function SponsorshipSection({
  sponsorships,
  sponsors,
  onAddSponsor,
  onAddSponsorship,
}) {
  return (
    <Stack spacing={2}>
      <Stack
        direction={{
          xs: "column",
          sm: "row",
        }}
        spacing={1}
        sx={{
          justifyContent: "space-between",
        }}
      >
        <Box>
          <Typography
            variant="h6"
            fontWeight={800}
            color="#0B2A78"
          >
            Student Sponsorship
          </Typography>

          <Typography color="text.secondary">
            Identify sponsored, partially sponsored,
            and unsponsored students.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<Add />}
            onClick={onAddSponsor}
          >
            Add Sponsor
          </Button>

          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={onAddSponsorship}
            sx={{ bgcolor: "#0B2A78" }}
          >
            Add Sponsorship
          </Button>
        </Stack>
      </Stack>

      <Paper
        variant="outlined"
        sx={{
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <TableContainer>
          <Table>
            <TableHead>
              <FinanceHeader>
                <TableCell>Student</TableCell>
                <TableCell>Academic Year</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Sponsor</TableCell>
                <TableCell>Coverage</TableCell>
                <TableCell>Reference</TableCell>
                <TableCell>Active</TableCell>
              </FinanceHeader>
            </TableHead>

            <TableBody>
              {sponsorships.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell>
                    <Typography fontWeight={700}>
                      {item.student_name}
                    </Typography>

                    <Typography
                      variant="caption"
                      color="text.secondary"
                    >
                      {item.admission_number}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    {item.academic_year_name}
                  </TableCell>

                  <TableCell>
                    <Chip
                      size="small"
                      label={
                        item.funding_status_display ||
                        item.funding_status
                      }
                      color={
                        fundingColors[
                          item.funding_status
                        ] || "default"
                      }
                    />
                  </TableCell>

                  <TableCell>
                    {item.sponsor_name || "—"}
                  </TableCell>

                  <TableCell>
                    {item.coverage_type_display ||
                      item.coverage_type}{" "}
                    {item.coverage_value
                      ? `— ${item.coverage_value}`
                      : ""}
                  </TableCell>

                  <TableCell>
                    {item.reference_number || "—"}
                  </TableCell>

                  <TableCell>
                    <Chip
                      size="small"
                      label={
                        item.active
                          ? "Active"
                          : "Inactive"
                      }
                      color={
                        item.active
                          ? "success"
                          : "default"
                      }
                    />
                  </TableCell>
                </TableRow>
              ))}

              {sponsorships.length === 0 && (
                <EmptyTableRow
                  colSpan={7}
                  message="No sponsorship records found."
                />
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Paper
        variant="outlined"
        sx={{
          p: 2,
          borderRadius: 3,
        }}
      >
        <Typography
          variant="h6"
          fontWeight={800}
          color="#0B2A78"
          mb={2}
        >
          Sponsors Registered: {sponsors.length}
        </Typography>

        <Stack
          direction="row"
          spacing={1}
          sx={{
            flexWrap: "wrap",
            gap: 1,
          }}
        >
          {sponsors.map((sponsor) => (
            <Chip
              key={sponsor.id}
              label={sponsor.name}
              variant="outlined"
            />
          ))}
        </Stack>
      </Paper>
    </Stack>
  );
}


function BankDepositSection({
  deposits,
  summary,
  onAddBankAccount,
  onAddDeposit,
  onVerify,
  onReject,
  onReconcile,
  submitting,
}) {
  return (
    <Stack spacing={2}>
      <Stack
        direction={{
          xs: "column",
          sm: "row",
        }}
        spacing={1}
        sx={{
          justifyContent: "space-between",
        }}
      >
        <Box>
          <Typography
            variant="h6"
            fontWeight={800}
            color="#0B2A78"
          >
            LBDI Bank Deposits
          </Typography>

          <Typography color="text.secondary">
            Enter student name, bank-slip number,
            payment date, and amount from every returned
            deposit slip.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            onClick={onAddBankAccount}
          >
            Add Bank Account
          </Button>

          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={onAddDeposit}
            sx={{ bgcolor: "#0B2A78" }}
          >
            Record Bank Slip
          </Button>
        </Stack>
      </Stack>

      <Grid container spacing={2}>
        <DashboardCard
          title="Total Bank Slips"
          value={summary.total_deposits || 0}
          icon={<Description />}
        />

        <DashboardCard
          title="Pending"
          value={summary.pending || 0}
          icon={<PendingActions />}
        />

        <DashboardCard
          title="Verified"
          value={summary.verified || 0}
          icon={<Verified />}
        />

        <DashboardCard
          title="Reconciled"
          value={summary.reconciled || 0}
          icon={<CheckCircle />}
        />
      </Grid>

      <BankDepositTable
        deposits={deposits}
        onVerify={onVerify}
        onReject={onReject}
        onReconcile={onReconcile}
        submitting={submitting}
      />
    </Stack>
  );
}


function BankDepositTable({
  deposits,
  onVerify,
  onReject,
  onReconcile,
  submitting = false,
  compact = false,
}) {
  return (
    <TableContainer>
      <Table size={compact ? "small" : "medium"}>
        <TableHead>
          <FinanceHeader>
            <TableCell>Student</TableCell>
            <TableCell>Bank Slip No.</TableCell>
            <TableCell>Payment Date</TableCell>
            <TableCell>Amount</TableCell>
            <TableCell>Student Type</TableCell>
            <TableCell>Sponsorship</TableCell>
            <TableCell>Status</TableCell>
            {!compact && (
              <TableCell>Actions</TableCell>
            )}
          </FinanceHeader>
        </TableHead>

        <TableBody>
          {deposits.map((deposit) => (
            <TableRow key={deposit.id} hover>
              <TableCell>
                <Typography fontWeight={700}>
                  {deposit.student_name_on_slip ||
                    deposit.student_name}
                </Typography>

                <Typography
                  variant="caption"
                  color="text.secondary"
                >
                  {deposit.admission_number}
                </Typography>
              </TableCell>

              <TableCell>
                {deposit.bank_slip_number}
              </TableCell>

              <TableCell>
                {formatDate(deposit.payment_date)}
              </TableCell>

              <TableCell>
                {formatMoney(
                  deposit.amount,
                  deposit.currency || "LRD"
                )}
              </TableCell>

              <TableCell>
                {deposit.student_category_display ||
                  deposit.student_category}
              </TableCell>

              <TableCell>
                <Chip
                  size="small"
                  label={
                    deposit
                      .sponsorship_status_display ||
                    deposit.sponsorship_status
                  }
                  color={
                    fundingColors[
                      deposit.sponsorship_status
                    ] || "default"
                  }
                />
              </TableCell>

              <TableCell>
                <Chip
                  size="small"
                  label={
                    deposit
                      .verification_status_display ||
                    deposit.verification_status
                  }
                  color={
                    verificationColors[
                      deposit.verification_status
                    ] || "default"
                  }
                />

                {deposit.receipt_number && (
                  <Typography
                    variant="caption"
                    display="block"
                    color="text.secondary"
                  >
                    {deposit.receipt_number}
                  </Typography>
                )}
              </TableCell>

              {!compact && (
                <TableCell>
                  <Stack direction="row" spacing={0.5}>
                    {deposit.verification_status ===
                      "PENDING" && (
                      <>
                        <Tooltip title="Verify deposit">
                          <span>
                            <IconButton
                              color="success"
                              disabled={submitting}
                              onClick={() =>
                                onVerify(deposit)
                              }
                            >
                              <Verified />
                            </IconButton>
                          </span>
                        </Tooltip>

                        <Tooltip title="Reject deposit">
                          <span>
                            <Button
                              color="error"
                              size="small"
                              disabled={submitting}
                              onClick={() =>
                                onReject(deposit)
                              }
                            >
                              Reject
                            </Button>
                          </span>
                        </Tooltip>
                      </>
                    )}

                    {deposit.verification_status ===
                      "VERIFIED" && (
                      <Button
                        size="small"
                        variant="outlined"
                        disabled={submitting}
                        onClick={() =>
                          onReconcile(deposit)
                        }
                      >
                        Reconcile
                      </Button>
                    )}
                  </Stack>
                </TableCell>
              )}
            </TableRow>
          ))}

          {deposits.length === 0 && (
            <EmptyTableRow
              colSpan={compact ? 7 : 8}
              message="No bank deposits found."
            />
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}



function WeeklyStatementsSection({
  statements,
  onUpload,
  onViewTransactions,
  onAutoMatch,
  submitting,
}) {
  const statusColors = {
    UPLOADED: "info",
    PROCESSING: "warning",
    REVIEW_REQUIRED: "warning",
    RECONCILED: "success",
    FAILED: "error",
  };

  return (
    <Stack spacing={2}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1}
        sx={{ justifyContent: "space-between" }}
      >
        <Box>
          <Typography
            variant="h6"
            fontWeight={800}
            color="#0B2A78"
          >
            Weekly LBDI Bank Statements
          </Typography>
          <Typography color="text.secondary">
            Upload each weekly statement and reconcile it
            with the bank-slip records entered by the registrar.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={onUpload}
          sx={{ bgcolor: "#0B2A78" }}
        >
          Upload Weekly Statement
        </Button>
      </Stack>

      <Paper
        variant="outlined"
        sx={{ borderRadius: 3, overflow: "hidden" }}
      >
        <TableContainer>
          <Table>
            <TableHead>
              <FinanceHeader>
                <TableCell>Week</TableCell>
                <TableCell>Bank Account</TableCell>
                <TableCell>File</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Transactions</TableCell>
                <TableCell>Matched</TableCell>
                <TableCell>Unmatched</TableCell>
                <TableCell>Total Amount</TableCell>
                <TableCell>Actions</TableCell>
              </FinanceHeader>
            </TableHead>
            <TableBody>
              {statements.map((statement) => (
                <TableRow key={statement.id} hover>
                  <TableCell>
                    <Typography fontWeight={700}>
                      {formatDate(statement.week_start_date)}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                    >
                      to {formatDate(statement.week_end_date)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {statement.bank_name || "LBDI"}
                    <Typography
                      variant="caption"
                      display="block"
                      color="text.secondary"
                    >
                      {statement.account_number || "—"}
                    </Typography>
                  </TableCell>
                  <TableCell>{statement.file_type || "—"}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={String(statement.status || "").replaceAll("_", " ")}
                      color={statusColors[statement.status] || "default"}
                    />
                  </TableCell>
                  <TableCell>{statement.total_transactions || 0}</TableCell>
                  <TableCell>{statement.matched_transactions || 0}</TableCell>
                  <TableCell>{statement.unmatched_transactions || 0}</TableCell>
                  <TableCell>
                    {formatMoney(statement.total_statement_amount, "LRD")}
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        onClick={() => onViewTransactions(statement)}
                      >
                        View
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        disabled={submitting}
                        onClick={() => onAutoMatch(statement)}
                      >
                        Auto Match
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}

              {statements.length === 0 && (
                <EmptyTableRow
                  colSpan={9}
                  message="No weekly bank statements have been uploaded."
                />
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Stack>
  );
}


function PaymentsSection({
  payments,
  onPrintReceipt,
}) {
  return (
    <Paper
      variant="outlined"
      sx={{ borderRadius: 3, overflow: "hidden" }}
    >
      <Box sx={{ p: 2 }}>
        <Typography
          variant="h6"
          fontWeight={800}
          color="#0B2A78"
        >
          Official School Receipts
        </Typography>
        <Typography color="text.secondary">
          Print or reprint official receipts for verified payments.
        </Typography>
      </Box>

      <TableContainer>
        <Table>
          <TableHead>
            <FinanceHeader>
              <TableCell>Receipt Number</TableCell>
              <TableCell>Student</TableCell>
              <TableCell>Invoice</TableCell>
              <TableCell>Bank Slip No.</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Statement Verified</TableCell>
              <TableCell>Print Status</TableCell>
              <TableCell>Action</TableCell>
            </FinanceHeader>
          </TableHead>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment.id} hover>
                <TableCell>{payment.receipt_number}</TableCell>
                <TableCell>
                  <Typography fontWeight={700}>
                    {payment.student_name}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    {payment.admission_number}
                  </Typography>
                </TableCell>
                <TableCell>{payment.invoice_number}</TableCell>
                <TableCell>
                  {payment.bank_slip_number || payment.reference || "—"}
                </TableCell>
                <TableCell>{formatMoney(payment.amount, "LRD")}</TableCell>
                <TableCell>{formatDate(payment.paid_at)}</TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={payment.verified_against_statement ? "Verified" : "Not Verified"}
                    color={payment.verified_against_statement ? "success" : "warning"}
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={
                      payment.receipt_printed
                        ? `Printed${
                            payment.receipt_reprint_count
                              ? ` — Reprinted ${payment.receipt_reprint_count} time(s)`
                              : ""
                          }`
                        : "Not Printed"
                    }
                    color={payment.receipt_printed ? "success" : "default"}
                  />
                </TableCell>
                <TableCell>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => onPrintReceipt(payment)}
                    sx={{ bgcolor: "#0B2A78" }}
                  >
                    {payment.receipt_printed ? "Reprint" : "Print Receipt"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}

            {payments.length === 0 && (
              <EmptyTableRow
                colSpan={9}
                message="No official receipts are available."
              />
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}


function ExpensesSection({
  expenses,
  onAddExpense,
  onAddCategory,
  onApprove,
}) {
  return (
    <Stack spacing={2}>
      <Stack
        direction={{
          xs: "column",
          sm: "row",
        }}
        spacing={1}
        sx={{
          justifyContent: "space-between",
        }}
      >
        <Box>
          <Typography
            variant="h6"
            fontWeight={800}
            color="#0B2A78"
          >
            School Expenses
          </Typography>

          <Typography color="text.secondary">
            Record and approve school operational
            expenses.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            onClick={onAddCategory}
          >
            Add Category
          </Button>

          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={onAddExpense}
            sx={{ bgcolor: "#0B2A78" }}
          >
            Record Expense
          </Button>
        </Stack>
      </Stack>

      <Paper
        variant="outlined"
        sx={{
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <TableContainer>
          <Table>
            <TableHead>
              <FinanceHeader>
                <TableCell>Expense No.</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Vendor</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Action</TableCell>
              </FinanceHeader>
            </TableHead>

            <TableBody>
              {expenses.map((expense) => (
                <TableRow key={expense.id} hover>
                  <TableCell>
                    {expense.expense_number}
                  </TableCell>

                  <TableCell>
                    {expense.category_name}
                  </TableCell>

                  <TableCell>
                    {expense.description}
                  </TableCell>

                  <TableCell>
                    {expense.vendor || "—"}
                  </TableCell>

                  <TableCell>
                    {formatMoney(
                      expense.amount,
                      "LRD"
                    )}
                  </TableCell>

                  <TableCell>
                    {formatDate(expense.date)}
                  </TableCell>

                  <TableCell>
                    <Chip
                      size="small"
                      label={
                        expense.approved
                          ? "Approved"
                          : "Pending"
                      }
                      color={
                        expense.approved
                          ? "success"
                          : "warning"
                      }
                    />
                  </TableCell>

                  <TableCell>
                    {!expense.approved && (
                      <Button
                        size="small"
                        onClick={() =>
                          onApprove(expense)
                        }
                      >
                        Approve
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}

              {expenses.length === 0 && (
                <EmptyTableRow
                  colSpan={8}
                  message="No expenses found."
                />
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Stack>
  );
}


function ReportsSection({
  unsponsoredStudents,
  outstandingStudents,
}) {
  return (
    <Stack spacing={3}>
      <Paper
        variant="outlined"
        sx={{
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography
            variant="h6"
            fontWeight={800}
            color="#0B2A78"
          >
            Unsponsored Students Report
          </Typography>

          <Typography color="text.secondary">
            This report can support the school owner’s
            sponsorship-lobbying activities.
          </Typography>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <FinanceHeader>
                <TableCell>Student</TableCell>
                <TableCell>Grade/Class</TableCell>
                <TableCell>Academic Year</TableCell>
                <TableCell>Required</TableCell>
                <TableCell>Paid</TableCell>
                <TableCell>Outstanding</TableCell>
              </FinanceHeader>
            </TableHead>

            <TableBody>
              {unsponsoredStudents.map((item) => (
                <TableRow
                  key={item.student_id}
                  hover
                >
                  <TableCell>
                    <Typography fontWeight={700}>
                      {item.student_name}
                    </Typography>

                    <Typography
                      variant="caption"
                      color="text.secondary"
                    >
                      {item.admission_number}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    {item.grade} {item.class_name}
                  </TableCell>

                  <TableCell>
                    {item.academic_year}
                  </TableCell>

                  <TableCell>
                    {formatMoney(
                      item.total_required,
                      "LRD"
                    )}
                  </TableCell>

                  <TableCell>
                    {formatMoney(
                      item.total_paid,
                      "LRD"
                    )}
                  </TableCell>

                  <TableCell>
                    <Typography
                      fontWeight={800}
                      color="error"
                    >
                      {formatMoney(
                        item.outstanding,
                        "LRD"
                      )}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}

              {unsponsoredStudents.length === 0 && (
                <EmptyTableRow
                  colSpan={6}
                  message="No unsponsored students found."
                />
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Paper
        variant="outlined"
        sx={{
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography
            variant="h6"
            fontWeight={800}
            color="#0B2A78"
          >
            Outstanding Student Costs
          </Typography>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <FinanceHeader>
                <TableCell>Invoice</TableCell>
                <TableCell>Student</TableCell>
                <TableCell>Academic Year</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Paid</TableCell>
                <TableCell>Balance</TableCell>
                <TableCell>Due Date</TableCell>
              </FinanceHeader>
            </TableHead>

            <TableBody>
              {outstandingStudents.map((item) => (
                <TableRow
                  key={item.invoice_id}
                  hover
                >
                  <TableCell>
                    {item.invoice_number}
                  </TableCell>

                  <TableCell>
                    <Typography fontWeight={700}>
                      {item.student_name}
                    </Typography>

                    <Typography
                      variant="caption"
                      color="text.secondary"
                    >
                      {item.admission_number}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    {item.academic_year_name}
                  </TableCell>

                  <TableCell>
                    {formatMoney(
                      item.total_amount,
                      "LRD"
                    )}
                  </TableCell>

                  <TableCell>
                    {formatMoney(
                      item.paid_amount,
                      "LRD"
                    )}
                  </TableCell>

                  <TableCell>
                    <Typography
                      color="error"
                      fontWeight={800}
                    >
                      {formatMoney(
                        item.balance,
                        "LRD"
                      )}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    {formatDate(item.due_date)}
                  </TableCell>
                </TableRow>
              ))}

              {outstandingStudents.length === 0 && (
                <EmptyTableRow
                  colSpan={7}
                  message="No outstanding balances found."
                />
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Stack>
  );
}


function SponsorDialog({
  open,
  onClose,
  onSaved,
  showMessage,
}) {
  const initialForm = {
    name: "",
    sponsor_type: "INDIVIDUAL",
    contact_person: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
    active: true,
  };

  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.name.trim()) {
      showMessage(
        "Sponsor name is required.",
        "warning"
      );
      return;
    }

    setSaving(true);

    try {
      await FinanceAPI.createSponsor(form);
      setForm(initialForm);
      await onSaved();
    } catch (error) {
      showMessage(getErrorMessage(error), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title="Add Sponsor"
      saving={saving}
      onSave={save}
    >
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 8 }}>
          <TextField
            fullWidth
            label="Sponsor name"
            required
            value={form.name}
            onChange={(event) =>
              setForm({
                ...form,
                name: event.target.value,
              })
            }
          />
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <TextField
            select
            fullWidth
            label="Sponsor type"
            value={form.sponsor_type}
            onChange={(event) =>
              setForm({
                ...form,
                sponsor_type: event.target.value,
              })
            }
          >
            {[
              "INDIVIDUAL",
              "ORGANIZATION",
              "CHURCH",
              "FOUNDATION",
              "COMPANY",
              "OTHER",
            ].map((value) => (
              <MenuItem key={value} value={value}>
                {value.replaceAll("_", " ")}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            label="Contact person"
            value={form.contact_person}
            onChange={(event) =>
              setForm({
                ...form,
                contact_person:
                  event.target.value,
              })
            }
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            label="Phone"
            value={form.phone}
            onChange={(event) =>
              setForm({
                ...form,
                phone: event.target.value,
              })
            }
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            type="email"
            label="Email"
            value={form.email}
            onChange={(event) =>
              setForm({
                ...form,
                email: event.target.value,
              })
            }
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            label="Address"
            value={form.address}
            onChange={(event) =>
              setForm({
                ...form,
                address: event.target.value,
              })
            }
          />
        </Grid>
      </Grid>
    </FormDialog>
  );
}


function SponsorshipDialog({
  open,
  onClose,
  students,
  sponsors,
  academicYears,
  defaultYear,
  onSaved,
  showMessage,
}) {
  const initialForm = {
    student: null,
    academic_year: defaultYear || "",
    sponsor: "",
    funding_status: "UNSPONSORED",
    coverage_type: "FULL",
    coverage_value: "0",
    start_date: "",
    end_date: "",
    reference_number: "",
    notes: "",
    active: true,
  };

  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm((current) => ({
        ...current,
        academic_year:
          current.academic_year ||
          defaultYear ||
          "",
      }));
    }
  }, [open, defaultYear]);

  const save = async () => {
    if (!form.student || !form.academic_year) {
      showMessage(
        "Student and academic year are required.",
        "warning"
      );
      return;
    }

    if (
      form.funding_status !== "UNSPONSORED" &&
      !form.sponsor
    ) {
      showMessage(
        "Select a sponsor for a sponsored student.",
        "warning"
      );
      return;
    }

    setSaving(true);

    try {
      await FinanceAPI.createSponsorship({
        student: form.student.id,
        academic_year: form.academic_year,
        sponsor:
          form.funding_status === "UNSPONSORED"
            ? null
            : form.sponsor,
        funding_status: form.funding_status,
        coverage_type: form.coverage_type,
        coverage_value:
          form.coverage_value || "0",
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        reference_number:
          form.reference_number,
        notes: form.notes,
        active: true,
      });

      setForm(initialForm);
      await onSaved();
    } catch (error) {
      showMessage(getErrorMessage(error), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title="Student Sponsorship Record"
      saving={saving}
      onSave={save}
    >
      <Grid container spacing={2}>
        <Grid size={12}>
          <Autocomplete
            options={students}
            value={form.student}
            getOptionLabel={(option) =>
              `${option.admission_number || ""} — ${
                option.full_name ||
                [
                  option.first_name,
                  option.middle_name,
                  option.last_name,
                ]
                  .filter(Boolean)
                  .join(" ")
              }`
            }
            onChange={(event, value) =>
              setForm({
                ...form,
                student: value,
              })
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Student"
                required
              />
            )}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            select
            fullWidth
            label="Academic year"
            value={form.academic_year}
            onChange={(event) =>
              setForm({
                ...form,
                academic_year:
                  event.target.value,
              })
            }
          >
            {academicYears.map((year) => (
              <MenuItem
                key={year.id}
                value={year.id}
              >
                {year.name}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            select
            fullWidth
            label="Funding status"
            value={form.funding_status}
            onChange={(event) =>
              setForm({
                ...form,
                funding_status:
                  event.target.value,
                sponsor:
                  event.target.value ===
                  "UNSPONSORED"
                    ? ""
                    : form.sponsor,
              })
            }
          >
            <MenuItem value="SPONSORED">
              Sponsored
            </MenuItem>

            <MenuItem value="PARTIALLY_SPONSORED">
              Partially Sponsored
            </MenuItem>

            <MenuItem value="UNSPONSORED">
              Unsponsored
            </MenuItem>
          </TextField>
        </Grid>

        {form.funding_status !== "UNSPONSORED" && (
          <Grid size={12}>
            <TextField
              select
              fullWidth
              label="Sponsor"
              value={form.sponsor}
              onChange={(event) =>
                setForm({
                  ...form,
                  sponsor: event.target.value,
                })
              }
            >
              {sponsors.map((sponsor) => (
                <MenuItem
                  key={sponsor.id}
                  value={sponsor.id}
                >
                  {sponsor.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        )}

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            select
            fullWidth
            label="Coverage type"
            value={form.coverage_type}
            onChange={(event) =>
              setForm({
                ...form,
                coverage_type:
                  event.target.value,
              })
            }
          >
            <MenuItem value="FULL">
              Full Cost
            </MenuItem>

            <MenuItem value="FIXED_AMOUNT">
              Fixed Amount
            </MenuItem>

            <MenuItem value="PERCENTAGE">
              Percentage
            </MenuItem>
          </TextField>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            type="number"
            label="Coverage value"
            value={form.coverage_value}
            onChange={(event) =>
              setForm({
                ...form,
                coverage_value:
                  event.target.value,
              })
            }
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            type="date"
            label="Start date"
            slotProps={{
              inputLabel: {
                shrink: true,
              },
            }}
            value={form.start_date}
            onChange={(event) =>
              setForm({
                ...form,
                start_date: event.target.value,
              })
            }
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            type="date"
            label="End date"
            slotProps={{
              inputLabel: {
                shrink: true,
              },
            }}
            value={form.end_date}
            onChange={(event) =>
              setForm({
                ...form,
                end_date: event.target.value,
              })
            }
          />
        </Grid>

        <Grid size={12}>
          <TextField
            fullWidth
            label="Sponsorship reference"
            value={form.reference_number}
            onChange={(event) =>
              setForm({
                ...form,
                reference_number:
                  event.target.value,
              })
            }
          />
        </Grid>
      </Grid>
    </FormDialog>
  );
}


function BankAccountDialog({
  open,
  onClose,
  onSaved,
  showMessage,
}) {
  const initialForm = {
    bank_name:
      "Liberian Bank for Development and Investment",
    short_name: "LBDI",
    account_name: "",
    account_number: "",
    currency: "LRD",
    branch: "",
    active: true,
  };

  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (
      !form.account_name.trim() ||
      !form.account_number.trim()
    ) {
      showMessage(
        "Account name and account number are required.",
        "warning"
      );
      return;
    }

    setSaving(true);

    try {
      await FinanceAPI.createBankAccount(form);
      setForm(initialForm);
      await onSaved();
    } catch (error) {
      showMessage(getErrorMessage(error), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title="Add School Bank Account"
      saving={saving}
      onSave={save}
    >
      <Grid container spacing={2}>
        {[
          ["bank_name", "Bank name"],
          ["short_name", "Short name"],
          ["account_name", "Account name"],
          ["account_number", "Account number"],
          ["currency", "Currency"],
          ["branch", "Branch"],
        ].map(([field, label]) => (
          <Grid
            key={field}
            size={{ xs: 12, md: 6 }}
          >
            <TextField
              fullWidth
              label={label}
              value={form[field]}
              onChange={(event) =>
                setForm({
                  ...form,
                  [field]: event.target.value,
                })
              }
            />
          </Grid>
        ))}
      </Grid>
    </FormDialog>
  );
}


function BankDepositDialog({
  open,
  onClose,
  students,
  academicYears,
  terms,
  invoices,
  bankAccounts,
  sponsorships,
  defaultYear,
  onSaved,
  showMessage,
}) {
  const getInitialForm = () => ({
    student: null,
    invoice: "",
    bank_account: "",
    student_name_on_slip: "",
    bank_slip_number: "",
    payment_date: "",
    amount: "",
    currency: "LRD",
    academic_year: defaultYear || "",
    term: "",
    student_category: "RETURNING",
    sponsorship_status: "UNSPONSORED",
    depositor_name: "",
    bank_reference: "",
    date_received_by_school: new Date().toISOString().slice(0, 10),
    notes: "",
  });

  const [form, setForm] = useState(getInitialForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm((current) => ({
      ...current,
      academic_year: current.academic_year || defaultYear || "",
    }));
  }, [open, defaultYear]);

  const studentInvoices = useMemo(() => {
    if (!form.student) return [];
    return invoices.filter(
      (invoice) => String(invoice.student) === String(form.student.id)
    );
  }, [invoices, form.student]);

  const availableTerms = useMemo(() => {
    if (!form.academic_year) return terms;
    return terms.filter(
      (term) => String(term.academic_year) === String(form.academic_year)
    );
  }, [terms, form.academic_year]);

  const handleStudentChange = (student) => {
    const sponsorship = sponsorships.find(
      (item) =>
        String(item.student) === String(student?.id) &&
        String(item.academic_year) === String(form.academic_year)
    );

    const studentName =
      student?.full_name ||
      [student?.first_name, student?.middle_name, student?.last_name]
        .filter(Boolean)
        .join(" ");

    setForm((current) => ({
      ...current,
      student,
      student_name_on_slip: studentName || "",
      sponsorship_status: sponsorship?.funding_status || "UNSPONSORED",
      invoice: "",
    }));
  };

  const save = async () => {
    if (
      !form.student ||
      !form.bank_account ||
      !form.student_name_on_slip.trim() ||
      !form.bank_slip_number.trim() ||
      !form.payment_date ||
      !form.amount ||
      Number(form.amount) <= 0 ||
      !form.academic_year
    ) {
      showMessage(
        "Student, bank account, student name on slip, bank-slip number, payment date, amount, and academic year are required.",
        "warning"
      );
      return;
    }

    const payload = {
      student: form.student.id,
      invoice: form.invoice || null,
      bank_account: form.bank_account,
      student_name_on_slip: form.student_name_on_slip.trim(),
      bank_slip_number: form.bank_slip_number.trim(),
      payment_date: form.payment_date,
      amount: form.amount,
      currency: form.currency,
      academic_year: form.academic_year,
      term: form.term || null,
      student_category: form.student_category,
      sponsorship_status: form.sponsorship_status,
      depositor_name: form.depositor_name.trim(),
      bank_reference: form.bank_reference.trim(),
      date_received_by_school: form.date_received_by_school,
      notes: form.notes.trim(),
    };

    setSaving(true);
    try {
      await FinanceAPI.createBankDeposit(payload);
      setForm(getInitialForm());
      await onSaved();
    } catch (error) {
      showMessage(getErrorMessage(error), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title="Record Returned LBDI Bank Slip"
      saving={saving}
      onSave={save}
      maxWidth="md"
    >
      <Alert severity="info" sx={{ mb: 3 }}>
        Enter the details from the physical bank slip. No bank-slip image upload is required.
      </Alert>

      <Grid container spacing={2}>
        <Grid size={12}>
          <Autocomplete
            options={students}
            value={form.student}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            getOptionLabel={(option) => {
              const fullName =
                option.full_name ||
                [option.first_name, option.middle_name, option.last_name]
                  .filter(Boolean)
                  .join(" ");
              return `${option.admission_number || ""} — ${fullName}`;
            }}
            onChange={(event, value) => handleStudentChange(value)}
            renderInput={(params) => (
              <TextField {...params} required label="Search and select student" />
            )}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField fullWidth required label="Student name written on slip" value={form.student_name_on_slip} onChange={(event) => setForm({ ...form, student_name_on_slip: event.target.value })} />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField fullWidth required label="Bank-slip number" value={form.bank_slip_number} onChange={(event) => setForm({ ...form, bank_slip_number: event.target.value })} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <TextField fullWidth required type="date" label="Date payment was made" value={form.payment_date} slotProps={{ inputLabel: { shrink: true } }} onChange={(event) => setForm({ ...form, payment_date: event.target.value })} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <TextField fullWidth required type="number" label="Amount paid" value={form.amount} inputProps={{ min: "0.01", step: "0.01" }} onChange={(event) => setForm({ ...form, amount: event.target.value })} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <TextField select fullWidth label="Currency" value={form.currency} onChange={(event) => setForm({ ...form, currency: event.target.value })}>
            <MenuItem value="LRD">Liberian Dollars — LRD</MenuItem>
            <MenuItem value="USD">United States Dollars — USD</MenuItem>
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField select fullWidth required label="Academic year" value={form.academic_year} onChange={(event) => setForm({ ...form, academic_year: event.target.value, term: "", invoice: "" })}>
            {academicYears.map((year) => <MenuItem key={year.id} value={year.id}>{year.name}{year.active ? " — Active" : ""}</MenuItem>)}
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField select fullWidth label="Term" value={form.term} onChange={(event) => setForm({ ...form, term: event.target.value })}>
            <MenuItem value="">No specific term</MenuItem>
            {availableTerms.map((term) => <MenuItem key={term.id} value={term.id}>{term.name}</MenuItem>)}
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField select fullWidth required label="LBDI bank account" value={form.bank_account} onChange={(event) => setForm({ ...form, bank_account: event.target.value })}>
            {bankAccounts.map((account) => <MenuItem key={account.id} value={account.id}>{account.short_name} — {account.account_number} — {account.currency}</MenuItem>)}
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField select fullWidth label="Student cost invoice" value={form.invoice} onChange={(event) => setForm({ ...form, invoice: event.target.value })}>
            <MenuItem value="">Link invoice later</MenuItem>
            {studentInvoices.map((invoice) => <MenuItem key={invoice.id} value={invoice.id}>{invoice.invoice_number} — Balance {formatMoney(invoice.balance, "LRD")}</MenuItem>)}
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField select fullWidth label="Student category" value={form.student_category} onChange={(event) => setForm({ ...form, student_category: event.target.value })}>
            <MenuItem value="NEW">New Student</MenuItem>
            <MenuItem value="RETURNING">Returning Student</MenuItem>
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField select fullWidth label="Sponsorship status" value={form.sponsorship_status} onChange={(event) => setForm({ ...form, sponsorship_status: event.target.value })}>
            <MenuItem value="SPONSORED">Sponsored</MenuItem>
            <MenuItem value="PARTIALLY_SPONSORED">Partially Sponsored</MenuItem>
            <MenuItem value="UNSPONSORED">Unsponsored</MenuItem>
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField fullWidth label="Depositor name" value={form.depositor_name} onChange={(event) => setForm({ ...form, depositor_name: event.target.value })} />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField fullWidth label="Bank transaction/reference" value={form.bank_reference} onChange={(event) => setForm({ ...form, bank_reference: event.target.value })} />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField fullWidth type="date" label="Date received by school" value={form.date_received_by_school} slotProps={{ inputLabel: { shrink: true } }} onChange={(event) => setForm({ ...form, date_received_by_school: event.target.value })} />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField fullWidth multiline minRows={2} label="Remarks or notes" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
        </Grid>
      </Grid>
    </FormDialog>
  );
}


function ExpenseCategoryDialog({
  open,
  onClose,
  onSaved,
  showMessage,
}) {
  const [name, setName] = useState("");
  const [description, setDescription] =
    useState("");
  const [saving, setSaving] = useState(false); 
 const save = async () => { 
  if (!name.trim()) {
      showMessage(
        "Expense category name is required.",
        "warning"
      );
      return;
    }

    setSaving(true);

    try {
      await FinanceAPI.createExpenseCategory({
        name,
        description,
        active: true,
      });

      setName("");
      setDescription("");
      await onSaved();
    } catch (error) {
      showMessage(getErrorMessage(error), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title="Add Expense Category"
      saving={saving}
      onSave={save}
    >
      <Stack spacing={2}>
        <TextField
          fullWidth
          required
          label="Category name"
          value={name}
          onChange={(event) =>
            setName(event.target.value)
          }
        />

        <TextField
          fullWidth
          multiline
          minRows={3}
          label="Description"
          value={description}
          onChange={(event) =>
            setDescription(event.target.value)
          }
        />
      </Stack>
    </FormDialog>
  );
}


function ExpenseDialog({
  open,
  onClose,
  categories,
  onSaved,
  showMessage,
}) {
  const initialForm = {
    category: "",
    description: "",
    amount: "",
    date: new Date().toISOString().slice(0, 10),
    payment_method: "CASH",
    reference: "",
    vendor: "",
  };

  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (
      !form.category ||
      !form.description.trim() ||
      !form.amount
    ) {
      showMessage(
        "Category, description, and amount are required.",
        "warning"
      );
      return;
    }

    setSaving(true);

    try {
      await FinanceAPI.createExpense(form);
      setForm(initialForm);
      await onSaved();
    } catch (error) {
      showMessage(getErrorMessage(error), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title="Record School Expense"
      saving={saving}
      onSave={save}
    >
      <Grid container spacing={2}>
        <Grid size={12}>
          <TextField
            select
            fullWidth
            required
            label="Expense category"
            value={form.category}
            onChange={(event) =>
              setForm({
                ...form,
                category: event.target.value,
              })
            }
          >
            {categories.map((category) => (
              <MenuItem
                key={category.id}
                value={category.id}
              >
                {category.name}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid size={12}>
          <TextField
            fullWidth
            required
            multiline
            minRows={3}
            label="Description"
            value={form.description}
            onChange={(event) =>
              setForm({
                ...form,
                description:
                  event.target.value,
              })
            }
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            type="number"
            required
            label="Amount"
            value={form.amount}
            onChange={(event) =>
              setForm({
                ...form,
                amount: event.target.value,
              })
            }
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            type="date"
            label="Expense date"
            slotProps={{
              inputLabel: {
                shrink: true,
              },
            }}
            value={form.date}
            onChange={(event) =>
              setForm({
                ...form,
                date: event.target.value,
              })
            }
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            select
            fullWidth
            label="Payment method"
            value={form.payment_method}
            onChange={(event) =>
              setForm({
                ...form,
                payment_method:
                  event.target.value,
              })
            }
          >
            <MenuItem value="CASH">
              Cash
            </MenuItem>

            <MenuItem value="MOBILE_MONEY">
              Mobile Money
            </MenuItem>

            <MenuItem value="BANK_TRANSFER">
              Bank Transfer
            </MenuItem>

            <MenuItem value="CHECK">
              Check
            </MenuItem>

            <MenuItem value="OTHER">
              Other
            </MenuItem>
          </TextField>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            label="Vendor"
            value={form.vendor}
            onChange={(event) =>
              setForm({
                ...form,
                vendor: event.target.value,
              })
            }
          />
        </Grid>

        <Grid size={12}>
          <TextField
            fullWidth
            label="Transaction reference"
            value={form.reference}
            onChange={(event) =>
              setForm({
                ...form,
                reference: event.target.value,
              })
            }
          />
        </Grid>
      </Grid>
    </FormDialog>
  );
}


function BankStatementDialog({
  open,
  onClose,
  bankAccounts,
  onSaved,
  showMessage,
}) {
  const initialForm = {
    bank_account: "",
    statement_number: "",
    week_start_date: "",
    week_end_date: "",
    statement_file: null,
    notes: "",
  };

  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (
      !form.bank_account ||
      !form.week_start_date ||
      !form.week_end_date ||
      !form.statement_file
    ) {
      showMessage(
        "Bank account, week start date, week end date, and statement file are required.",
        "warning"
      );
      return;
    }

    if (form.week_end_date < form.week_start_date) {
      showMessage(
        "Week end date cannot be before the week start date.",
        "warning"
      );
      return;
    }

    const payload = new FormData();
    payload.append("bank_account", form.bank_account);
    payload.append("statement_number", form.statement_number);
    payload.append("week_start_date", form.week_start_date);
    payload.append("week_end_date", form.week_end_date);
    payload.append("statement_file", form.statement_file);
    payload.append("notes", form.notes);

    setSaving(true);
    try {
      await FinanceAPI.uploadBankStatement(payload);
      setForm(initialForm);
      await onSaved();
    } catch (error) {
      showMessage(getErrorMessage(error), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title="Upload Weekly LBDI Statement"
      saving={saving}
      onSave={save}
    >
      <Stack spacing={2}>
        <TextField select fullWidth required label="Bank account" value={form.bank_account} onChange={(event) => setForm({ ...form, bank_account: event.target.value })}>
          {bankAccounts.map((account) => <MenuItem key={account.id} value={account.id}>{account.short_name} — {account.account_number}</MenuItem>)}
        </TextField>
        <TextField fullWidth label="Statement number" value={form.statement_number} onChange={(event) => setForm({ ...form, statement_number: event.target.value })} />
        <TextField fullWidth required type="date" label="Week start date" value={form.week_start_date} slotProps={{ inputLabel: { shrink: true } }} onChange={(event) => setForm({ ...form, week_start_date: event.target.value })} />
        <TextField fullWidth required type="date" label="Week end date" value={form.week_end_date} slotProps={{ inputLabel: { shrink: true } }} onChange={(event) => setForm({ ...form, week_end_date: event.target.value })} />
        <Button component="label" variant="outlined" fullWidth sx={{ minHeight: 56 }}>
          {form.statement_file ? form.statement_file.name : "Select PDF, Excel, or CSV Statement"}
          <input hidden type="file" accept=".pdf,.xlsx,.xls,.csv" onChange={(event) => setForm({ ...form, statement_file: event.target.files?.[0] || null })} />
        </Button>
        <TextField fullWidth multiline minRows={3} label="Notes" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
      </Stack>
    </FormDialog>
  );
}


function StatementTransactionsDialog({
  open,
  onClose,
  statement,
  transactions,
}) {
  const matchColors = {
    MATCHED: "success",
    UNMATCHED: "warning",
    MANUAL_REVIEW: "warning",
    DUPLICATE: "error",
    IGNORED: "default",
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle>
        Statement Transactions
        {statement
          ? ` — ${formatDate(statement.week_start_date)} to ${formatDate(statement.week_end_date)}`
          : ""}
      </DialogTitle>
      <DialogContent>
        <TableContainer>
          <Table>
            <TableHead>
              <FinanceHeader>
                <TableCell>Date</TableCell>
                <TableCell>Slip Number</TableCell>
                <TableCell>Reference</TableCell>
                <TableCell>Depositor</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Matched Student</TableCell>
                <TableCell>Receipt</TableCell>
              </FinanceHeader>
            </TableHead>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id} hover>
                  <TableCell>{formatDate(transaction.transaction_date)}</TableCell>
                  <TableCell>{transaction.bank_slip_number || "—"}</TableCell>
                  <TableCell>{transaction.bank_reference || "—"}</TableCell>
                  <TableCell>{transaction.depositor_name || "—"}</TableCell>
                  <TableCell>{transaction.description || "—"}</TableCell>
                  <TableCell>{formatMoney(transaction.amount, transaction.currency || "LRD")}</TableCell>
                  <TableCell><Chip size="small" label={String(transaction.match_status || "").replaceAll("_", " ")} color={matchColors[transaction.match_status] || "default"} /></TableCell>
                  <TableCell>{transaction.matched_student_name || "—"}</TableCell>
                  <TableCell>{transaction.matched_receipt_number || "—"}</TableCell>
                </TableRow>
              ))}
              {transactions.length === 0 && <EmptyTableRow colSpan={9} message="No transactions are available for this statement." />}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}


function FormDialog({
  open,
  onClose,
  title,
  children,
  saving,
  onSave,
  maxWidth = "sm",
}) {
  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      fullWidth
      maxWidth={maxWidth}
    >
      <DialogTitle>{title}</DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 3 }}>
        {children}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button
          onClick={onClose}
          disabled={saving}
        >
          Cancel
        </Button>

        <Button
          variant="contained"
          disabled={saving}
          onClick={onSave}
          sx={{ bgcolor: "#0B2A78" }}
        >
          {saving ? (
            <CircularProgress
              size={22}
              color="inherit"
            />
          ) : (
            "Save"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}


function FinanceHeader({ children }) {
  return (
    <TableRow
      sx={{
        "& th": {
          bgcolor: "#0B2A78",
          color: "#FFFFFF",
          fontWeight: 800,
          whiteSpace: "nowrap",
        },
      }}
    >
      {children}
    </TableRow>
  );
}


function EmptyTableRow({
  colSpan,
  message,
}) {
  return (
    <TableRow>
      <TableCell
        colSpan={colSpan}
        align="center"
        sx={{ py: 5 }}
      >
        <Typography color="text.secondary">
          {message}
        </Typography>
      </TableCell>
    </TableRow>
  );
}


function LoadingScreen() {
  return (
    <Box
      sx={{
        minHeight: "60vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Stack
        spacing={2}
        sx={{ alignItems: "center" }}
      >
        <CircularProgress />

        <Typography color="text.secondary">
          Loading finance system...
        </Typography>
      </Stack>
    </Box>
  );
}