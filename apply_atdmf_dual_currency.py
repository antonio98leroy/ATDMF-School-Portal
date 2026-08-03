#!/usr/bin/env python3
from __future__ import annotations

import re
import shutil
from pathlib import Path

ROOT = Path.home() / "ATDMF-School-Portal"

FILES = {
    "models": ROOT / "backend/finance/models.py",
    "finance_views": ROOT / "backend/finance/views.py",
    "reports_views": ROOT / "backend/academics/reports_views.py",
    "reports_page": ROOT / "frontend/src/pages/ReportsCenter.jsx",
}


def backup(path: Path) -> None:
    target = path.with_name(path.name + ".before_dual_currency")
    if not target.exists():
        shutil.copy2(path, target)


def require_files() -> None:
    missing = [str(path) for path in FILES.values() if not path.exists()]
    if missing:
        raise SystemExit("Missing required files:\n" + "\n".join(missing))


def replace_class_block(text: str, class_name: str, next_class_name: str, replacement: str) -> str:
    pattern = re.compile(
        rf"^class {re.escape(class_name)}\b.*?(?=^class {re.escape(next_class_name)}\b)",
        re.MULTILINE | re.DOTALL,
    )
    if not pattern.search(text):
        raise RuntimeError(f"Could not locate class {class_name} before {next_class_name}.")
    return pattern.sub(replacement.rstrip() + "\n\n", text, count=1)


def patch_models() -> None:
    path = FILES["models"]
    backup(path)
    text = path.read_text()

    if not re.search(r"class StudentInvoice\b.*?\bcurrency\s*=", text, re.DOTALL):
        pattern = re.compile(
            r"(class StudentInvoice\(models\.Model\):\s*"
            r".*?total_amount=models\.DecimalField"
            r"\(max_digits=12,decimal_places=2\);)",
            re.DOTALL,
        )
        replacement = (
            r"\1 currency=models.CharField("
            r"max_length=3,"
            r"choices=[('LRD','Liberian Dollar'),('USD','United States Dollar')],"
            r"default='LRD'"
            r");"
        )
        text, count = pattern.subn(replacement, text, count=1)
        if count != 1:
            raise RuntimeError("Could not add currency to StudentInvoice.")

    payment_start = text.index("class Payment(models.Model):")
    expense_category_start = text.index("class ExpenseCategory(models.Model):")
    payment_block = text[payment_start:expense_category_start]

    if "class Currency(models.TextChoices):" not in payment_block:
        payment_block = payment_block.replace(
            "class Payment(models.Model):\n",
            'class Payment(models.Model):\n'
            '    class Currency(models.TextChoices):\n'
            '        LRD = "LRD", "Liberian Dollar"\n'
            '        USD = "USD", "United States Dollar"\n\n',
            1,
        )

    if not re.search(r"^\s{4}currency\s*=\s*models\.CharField", payment_block, re.MULTILINE):
        amount_pattern = re.compile(
            r"(\n    amount = models\.DecimalField\(.*?\n    \)\n)",
            re.DOTALL,
        )
        payment_block, count = amount_pattern.subn(
            r'''\1
    currency = models.CharField(
        max_length=3,
        choices=Currency.choices,
        default=Currency.LRD,
    )
''',
            payment_block,
            count=1,
        )
        if count != 1:
            raise RuntimeError("Could not add currency to Payment.")

    text = text[:payment_start] + payment_block + text[expense_category_start:]

    expense_start = text.index("class Expense(models.Model):")
    sponsor_start = text.index("class Sponsor(models.Model):")
    expense_block = text[expense_start:sponsor_start]

    if "class Currency(models.TextChoices):" not in expense_block:
        expense_block = expense_block.replace(
            "class Expense(models.Model):\n",
            'class Expense(models.Model):\n'
            '    class Currency(models.TextChoices):\n'
            '        LRD = "LRD", "Liberian Dollar"\n'
            '        USD = "USD", "United States Dollar"\n\n',
            1,
        )

    if not re.search(r"^\s{4}currency\s*=\s*models\.CharField", expense_block, re.MULTILINE):
        amount_pattern = re.compile(
            r"(\n    amount = models\.DecimalField\(.*?\n    \)\n)",
            re.DOTALL,
        )
        expense_block, count = amount_pattern.subn(
            r'''\1
    currency = models.CharField(
        max_length=3,
        choices=Currency.choices,
        default=Currency.LRD,
    )
''',
            expense_block,
            count=1,
        )
        if count != 1:
            raise RuntimeError("Could not add currency to Expense.")

    text = text[:expense_start] + expense_block + text[sponsor_start:]
    path.write_text(text)


def patch_finance_views() -> None:
    path = FILES["finance_views"]
    backup(path)
    text = path.read_text()

    if "currency=deposit.currency" not in text:
        pattern = re.compile(
            r"(Payment\.objects\.create\(\s*.*?amount=deposit\.amount,\s*)",
            re.DOTALL,
        )
        text, count = pattern.subn(
            r"\1currency=deposit.currency,\n            ",
            text,
            count=1,
        )
        if count != 1:
            raise RuntimeError("Could not add deposit currency to Payment.objects.create().")

    path.write_text(text)


REPORTS_SUMMARY = r'''class ReportsSummaryView(ReportsBaseView):
    def get(self, request):
        academic_year = self.get_academic_year(request)

        enrollments = Enrollment.objects.filter(active=True)

        if academic_year:
            enrollments = enrollments.filter(
                academic_year=academic_year
            )

        payments = Payment.objects.all()
        invoices = StudentInvoice.objects.all()
        expenses = Expense.objects.all()
        sponsorships = StudentSponsorship.objects.all()
        promotions = StudentPromotion.objects.all()

        if academic_year:
            if field_exists(
                StudentSponsorship,
                "academic_year",
            ):
                sponsorships = sponsorships.filter(
                    academic_year=academic_year
                )

            promotions = promotions.filter(
                source_academic_year=academic_year
            )

        def currency_totals(queryset, amount_field):
            totals = {}

            for currency in ("LRD", "USD"):
                totals[currency] = (
                    queryset.filter(
                        currency=currency
                    ).aggregate(
                        total=Sum(amount_field)
                    )["total"]
                    or Decimal("0.00")
                )

            return totals

        collected = currency_totals(
            payments,
            "amount",
        )

        invoiced = currency_totals(
            invoices,
            "total_amount",
        )

        expense_totals = currency_totals(
            expenses,
            "amount",
        )

        outstanding = {
            currency: max(
                invoiced[currency] - collected[currency],
                Decimal("0.00"),
            )
            for currency in ("LRD", "USD")
        }

        sponsored_ids = sponsorships.filter(
            funding_status__in=[
                "SPONSORED",
                "PARTIALLY_SPONSORED",
            ]
        ).values_list(
            "student_id",
            flat=True,
        )

        return Response(
            {
                "academic_year": (
                    {
                        "id": academic_year.id,
                        "name": academic_year.name,
                    }
                    if academic_year
                    else None
                ),
                "students": Student.objects.filter(
                    is_active=True
                ).count(),
                "active_enrollments": enrollments.count(),
                "classes": ClassSection.objects.count(),
                "employees": Employee.objects.count(),
                "sponsored": (
                    Student.objects.filter(
                        id__in=sponsored_ids,
                        is_active=True,
                    )
                    .distinct()
                    .count()
                ),
                "unsponsored": (
                    Student.objects.filter(
                        is_active=True
                    )
                    .exclude(id__in=sponsored_ids)
                    .count()
                ),
                "finance_by_currency": {
                    currency: {
                        "collected": decimal_value(
                            collected[currency]
                        ),
                        "invoiced": decimal_value(
                            invoiced[currency]
                        ),
                        "outstanding": decimal_value(
                            outstanding[currency]
                        ),
                        "expenses": decimal_value(
                            expense_totals[currency]
                        ),
                        "net": decimal_value(
                            collected[currency]
                            - expense_totals[currency]
                        ),
                    }
                    for currency in ("LRD", "USD")
                },
                "promotions": promotions.count(),
                "bank_statements": BankStatement.objects.count(),
            }
        )
'''


FINANCE_REPORT = r'''class FinanceReportView(ReportsBaseView):
    def get(self, request):
        report_type = request.query_params.get(
            "type",
            "payments",
        )

        date_from = request.query_params.get(
            "date_from"
        )
        date_to = request.query_params.get(
            "date_to"
        )
        currency = request.query_params.get(
            "currency"
        )

        if report_type == "outstanding":
            queryset = (
                StudentInvoice.objects
                .select_related(
                    "student",
                    "term",
                    "term__academic_year",
                )
                .all()
            )

            if currency:
                queryset = queryset.filter(
                    currency=currency
                )

            records = []

            for invoice in queryset:
                balance = invoice.balance

                if callable(balance):
                    balance = balance()

                if Decimal(str(balance or 0)) <= 0:
                    continue

                records.append(
                    {
                        "invoice_number": invoice.invoice_number,
                        "admission_number": (
                            invoice.student.admission_number
                        ),
                        "student_name": full_name(
                            invoice.student
                        ),
                        "academic_year": (
                            invoice.term.academic_year.name
                        ),
                        "term": invoice.term.name,
                        "currency": invoice.currency,
                        "total_amount": decimal_value(
                            invoice.total_amount
                        ),
                        "paid_amount": decimal_value(
                            invoice.paid_amount
                        ),
                        "balance": decimal_value(
                            balance
                        ),
                        "due_date": invoice.due_date,
                    }
                )

            return Response(records)

        if report_type == "expenses":
            queryset = Expense.objects.all()

            if date_from:
                queryset = queryset.filter(
                    date__gte=date_from
                )

            if date_to:
                queryset = queryset.filter(
                    date__lte=date_to
                )

            if currency:
                queryset = queryset.filter(
                    currency=currency
                )

            return Response(
                [
                    {
                        "expense_number": getattr(
                            item,
                            "expense_number",
                            item.id,
                        ),
                        "category": getattr(
                            getattr(
                                item,
                                "category",
                                None,
                            ),
                            "name",
                            getattr(
                                item,
                                "category",
                                "",
                            ),
                        ),
                        "description": item.description,
                        "vendor": getattr(
                            item,
                            "vendor",
                            "",
                        ) or "",
                        "currency": item.currency,
                        "amount": decimal_value(
                            item.amount
                        ),
                        "date": item.date,
                        "approved": getattr(
                            item,
                            "approved",
                            True,
                        ),
                    }
                    for item in queryset.order_by("-date")
                ]
            )

        queryset = (
            Payment.objects.select_related(
                "invoice",
                "invoice__student",
            )
            .all()
        )

        if date_from:
            queryset = queryset.filter(
                paid_at__date__gte=date_from
            )

        if date_to:
            queryset = queryset.filter(
                paid_at__date__lte=date_to
            )

        if currency:
            queryset = queryset.filter(
                currency=currency
            )

        return Response(
            [
                {
                    "receipt_number": item.receipt_number,
                    "admission_number": (
                        item.invoice.student.admission_number
                    ),
                    "student_name": full_name(
                        item.invoice.student
                    ),
                    "invoice_number": (
                        item.invoice.invoice_number
                    ),
                    "currency": item.currency,
                    "amount": decimal_value(
                        item.amount
                    ),
                    "method": (
                        item.get_method_display()
                        if hasattr(
                            item,
                            "get_method_display",
                        )
                        else item.method
                    ),
                    "bank_slip_number": getattr(
                        item,
                        "bank_slip_number",
                        "",
                    ) or "",
                    "paid_at": item.paid_at,
                    "verified_against_statement": getattr(
                        item,
                        "verified_against_statement",
                        False,
                    ),
                }
                for item in queryset.order_by("-paid_at")
            ]
        )
'''


def patch_reports_views() -> None:
    path = FILES["reports_views"]
    backup(path)
    text = path.read_text()

    text = replace_class_block(
        text,
        "ReportsSummaryView",
        "StudentRegisterReportView",
        REPORTS_SUMMARY,
    )

    text = replace_class_block(
        text,
        "FinanceReportView",
        "PromotionReportView",
        FINANCE_REPORT,
    )

    path.write_text(text)


def patch_reports_page() -> None:
    path = FILES["reports_page"]
    backup(path)
    text = path.read_text()

    money_pattern = re.compile(
        r"function money\(value\) \{.*?\n\}",
        re.DOTALL,
    )

    money_replacement = r'''function money(
  value,
  currency = "LRD"
) {
  const amount = Number(value || 0);

  if (currency === "USD") {
    return new Intl.NumberFormat(
      "en-US",
      {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
      }
    ).format(amount);
  }

  return `L$ ${amount.toLocaleString(
    "en-US",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  )}`;
}'''

    text, count = money_pattern.subn(
        money_replacement,
        text,
        count=1,
    )
    if count != 1:
        raise RuntimeError("Could not replace the money() function.")

    if 'const [currency, setCurrency]' not in text:
        marker = '''  const [financeType, setFinanceType] =
    useState("payments");
'''
        replacement = marker + '''
  const [currency, setCurrency] =
    useState("");
'''
        if marker not in text:
            raise RuntimeError("Could not locate financeType state.")
        text = text.replace(marker, replacement, 1)

    old_finance_call = '''            await ReportsAPI.getFinance({
              ...common,
              type: financeType,
            });'''
    new_finance_call = '''            await ReportsAPI.getFinance({
              ...common,
              type: financeType,
              currency:
                currency || undefined,
            });'''

    if old_finance_call in text:
        text = text.replace(old_finance_call, new_finance_call, 1)

    if 'label="Currency"' not in text:
        finance_filter_end = '''              </Grid>
            )}

            {activeReport.key ===
              "promotions" && ('''

        currency_selector = '''              </Grid>
            )}

            {activeReport.key ===
              "finance" && (
              <Grid
                size={{
                  xs: 12,
                  md: 2,
                }}
              >
                <FormControl
                  fullWidth
                  size="small"
                >
                  <InputLabel>
                    Currency
                  </InputLabel>

                  <Select
                    label="Currency"
                    value={currency}
                    onChange={(event) =>
                      setCurrency(
                        event.target.value
                      )
                    }
                  >
                    <MenuItem value="">
                      All Currencies
                    </MenuItem>

                    <MenuItem value="LRD">
                      LRD
                    </MenuItem>

                    <MenuItem value="USD">
                      USD
                    </MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}

            {activeReport.key ===
              "promotions" && ('''

        if finance_filter_end not in text:
            raise RuntimeError("Could not locate finance filter section.")

        text = text.replace(
            finance_filter_end,
            currency_selector,
            1,
        )

    old_cards = '''          <SummaryCard
            title="Collected"
            value={money(
              summary.total_collected
            )}
            icon={<Payments />}
          />

          <SummaryCard
            title="Outstanding"
            value={money(
              summary.outstanding
            )}
            icon={<Payments />}
          />'''

    new_cards = '''          <SummaryCard
            title="Collected — LRD"
            value={money(
              summary.finance_by_currency
                ?.LRD?.collected,
              "LRD"
            )}
            icon={<Payments />}
          />

          <SummaryCard
            title="Collected — USD"
            value={money(
              summary.finance_by_currency
                ?.USD?.collected,
              "USD"
            )}
            icon={<Payments />}
          />

          <SummaryCard
            title="Outstanding — LRD"
            value={money(
              summary.finance_by_currency
                ?.LRD?.outstanding,
              "LRD"
            )}
            icon={<Payments />}
          />

          <SummaryCard
            title="Outstanding — USD"
            value={money(
              summary.finance_by_currency
                ?.USD?.outstanding,
              "USD"
            )}
            icon={<Payments />}
          />'''

    if old_cards in text:
        text = text.replace(old_cards, new_cards, 1)
    elif 'title="Collected — LRD"' not in text:
        raise RuntimeError("Could not locate old summary finance cards.")

    replacements = [
        (
            '''        {
          label: "Total",
          value: (row) =>
            money(row.total_amount),
        },''',
            '''        {
          label: "Currency",
          value: "currency",
        },
        {
          label: "Total",
          value: (row) =>
            money(
              row.total_amount,
              row.currency
            ),
        },''',
            1,
        ),
        (
            '''        {
          label: "Paid",
          value: (row) =>
            money(row.paid_amount),
        },''',
            '''        {
          label: "Paid",
          value: (row) =>
            money(
              row.paid_amount,
              row.currency
            ),
        },''',
            1,
        ),
        (
            '''        {
          label: "Balance",
          value: (row) =>
            money(row.balance),
        },''',
            '''        {
          label: "Balance",
          value: (row) =>
            money(
              row.balance,
              row.currency
            ),
        },''',
            1,
        ),
    ]

    for old, new, count in replacements:
        text = text.replace(old, new, count)

    amount_old = '''        {
          label: "Amount",
          value: (row) =>
            money(row.amount),
        },'''
    amount_new = '''        {
          label: "Currency",
          value: "currency",
        },
        {
          label: "Amount",
          value: (row) =>
            money(
              row.amount,
              row.currency
            ),
        },'''
    text = text.replace(amount_old, amount_new, 2)

    path.write_text(text)


def main() -> None:
    require_files()
    patch_models()
    patch_finance_views()
    patch_reports_views()
    patch_reports_page()

    print("Dual-currency patch completed.")
    print()
    print("Run next:")
    print("cd ~/ATDMF-School-Portal/backend")
    print("source venv/bin/activate")
    print("python manage.py makemigrations finance")
    print("python manage.py migrate")
    print("python manage.py check")
    print()
    print("cd ~/ATDMF-School-Portal/frontend")
    print("npm run build")
    print("npm run dev")


if __name__ == "__main__":
    main()
