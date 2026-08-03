from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    BankAccountViewSet,
    BankDepositViewSet,
    BankStatementViewSet,
    BankStatementTransactionViewSet,
    ExpenseCategoryViewSet,
    ExpenseViewSet,
    FeeStructureViewSet,
    FeeTypeViewSet,
    FinanceReportViewSet,
    InvoiceViewSet,
    PaymentViewSet,
    SponsorViewSet,
    StudentSponsorshipViewSet,
)


router = DefaultRouter()

router.register(
    "fee-types",
    FeeTypeViewSet,
    basename="fee-type",
)

router.register(
    "structures",
    FeeStructureViewSet,
    basename="fee-structure",
)

router.register(
    "sponsors",
    SponsorViewSet,
    basename="sponsor",
)

router.register(
    "sponsorships",
    StudentSponsorshipViewSet,
    basename="student-sponsorship",
)

router.register(
    "bank-accounts",
    BankAccountViewSet,
    basename="bank-account",
)

router.register(
    "bank-deposits",
    BankDepositViewSet,
    basename="bank-deposit",
)

router.register(
    "invoices",
    InvoiceViewSet,
    basename="student-invoice",
)

router.register(
    "payments",
    PaymentViewSet,
    basename="payment",
)

router.register(
    "expense-categories",
    ExpenseCategoryViewSet,
    basename="expense-category",
)

router.register(
    "expenses",
    ExpenseViewSet,
    basename="expense",
)

router.register(
    "bank-statements",
    BankStatementViewSet,
    basename="bank-statement",
)

router.register(
    "bank-statement-transactions",
    BankStatementTransactionViewSet,
    basename="bank-statement-transaction",
)

router.register(
    "reports",
    FinanceReportViewSet,
    basename="finance-report",
)


urlpatterns = [
    path("", include(router.urls)),
]
