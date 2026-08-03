from decimal import Decimal

from django.db import transaction
from django.db.models import Q, Sum
from django.utils import timezone

from rest_framework import (
    filters,
    permissions,
    status,
    viewsets,
)
from rest_framework.decorators import action
from rest_framework.response import Response

from academics.models import Enrollment

from .models import (
    BankAccount,
    BankDeposit,
    BankStatement,
    BankStatementTransaction,
    Expense,
    ExpenseCategory,
    FeeStructure,
    FeeType,
    Payment,
    Sponsor,
    StudentInvoice,
    StudentSponsorship,
)
from .serializers import (
    BankAccountSerializer,
    BankDepositSerializer,
    BankStatementSerializer,
    BankStatementTransactionSerializer,
    ExpenseCategorySerializer,
    ExpenseSerializer,
    FeeStructureSerializer,
    FeeTypeSerializer,
    InvoiceSerializer,
    PaymentSerializer,
    SponsorSerializer,
    StudentSponsorshipSerializer,
)


class FinanceBaseViewSet(viewsets.ModelViewSet):
    permission_classes = [
        permissions.IsAuthenticated,
    ]


class FeeTypeViewSet(FinanceBaseViewSet):
    queryset = FeeType.objects.all()
    serializer_class = FeeTypeSerializer

    filter_backends = [
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    search_fields = [
        "name",
        "description",
    ]

    ordering = ["name"]


class FeeStructureViewSet(FinanceBaseViewSet):
    serializer_class = FeeStructureSerializer

    filter_backends = [
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    search_fields = [
        "fee_type__name",
        "grade__name",
        "academic_year__name",
        "term__name",
    ]

    ordering = [
        "-academic_year__start_date",
        "grade__order",
        "fee_type__name",
    ]

    def get_queryset(self):
        queryset = (
            FeeStructure.objects
            .select_related(
                "fee_type",
                "grade",
                "academic_year",
                "term",
            )
            .all()
        )

        academic_year = self.request.query_params.get(
            "academic_year"
        )

        term = self.request.query_params.get("term")
        grade = self.request.query_params.get("grade")

        if academic_year:
            queryset = queryset.filter(
                academic_year_id=academic_year
            )

        if term:
            queryset = queryset.filter(
                term_id=term
            )

        if grade:
            queryset = queryset.filter(
                grade_id=grade
            )

        return queryset


class InvoiceViewSet(FinanceBaseViewSet):
    serializer_class = InvoiceSerializer

    filter_backends = [
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    search_fields = [
        "invoice_number",
        "student__admission_number",
        "student__first_name",
        "student__middle_name",
        "student__last_name",
    ]

    ordering_fields = [
        "created_at",
        "due_date",
        "total_amount",
    ]

    ordering = ["-created_at"]

    def get_queryset(self):
        queryset = (
            StudentInvoice.objects
            .select_related(
                "student",
                "term",
                "term__academic_year",
            )
            .prefetch_related("payments")
            .all()
        )

        student = self.request.query_params.get(
            "student"
        )

        academic_year = self.request.query_params.get(
            "academic_year"
        )

        term = self.request.query_params.get("term")

        if student:
            queryset = queryset.filter(
                student_id=student
            )

        if academic_year:
            queryset = queryset.filter(
                term__academic_year_id=academic_year
            )

        if term:
            queryset = queryset.filter(
                term_id=term
            )

        return queryset

    @action(
        detail=True,
        methods=["get"],
        url_path="statement",
    )
    def statement(self, request, pk=None):
        invoice = self.get_object()

        payments = (
            invoice.payments
            .select_related("received_by")
            .order_by("paid_at")
        )

        return Response(
            {
                "invoice": self.get_serializer(
                    invoice
                ).data,
                "payments": PaymentSerializer(
                    payments,
                    many=True,
                ).data,
            }
        )


class PaymentViewSet(FinanceBaseViewSet):
    serializer_class = PaymentSerializer

    filter_backends = [
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    search_fields = [
        "receipt_number",
        "reference",
        "invoice__invoice_number",
        "invoice__student__admission_number",
        "invoice__student__first_name",
        "invoice__student__last_name",
    ]

    ordering_fields = [
        "paid_at",
        "amount",
    ]

    ordering = ["-paid_at"]

    def get_queryset(self):
        queryset = (
            Payment.objects
            .select_related(
                "invoice",
                "invoice__student",
                "invoice__term",
                "invoice__term__academic_year",
                "received_by",
            )
            .all()
        )

        invoice = self.request.query_params.get(
            "invoice"
        )

        student = self.request.query_params.get(
            "student"
        )

        academic_year = self.request.query_params.get(
            "academic_year"
        )

        date_from = self.request.query_params.get(
            "date_from"
        )

        date_to = self.request.query_params.get(
            "date_to"
        )

        if invoice:
            queryset = queryset.filter(
                invoice_id=invoice
            )

        if student:
            queryset = queryset.filter(
                invoice__student_id=student
            )

        if academic_year:
            queryset = queryset.filter(
                invoice__term__academic_year_id=(
                    academic_year
                )
            )

        if date_from:
            queryset = queryset.filter(
                paid_at__date__gte=date_from
            )

        if date_to:
            queryset = queryset.filter(
                paid_at__date__lte=date_to
            )

        return queryset
        @action(
        detail=True,
        methods=["post"],
        url_path="mark-receipt-printed",

    )
        def mark_receipt_printed(
        self,
        request,
        pk=None,
    ):
         payment = self.get_object()

        if payment.receipt_printed:
            payment.receipt_reprint_count += 1
        else:
            payment.receipt_printed = True

        payment.receipt_printed_by = request.user
        payment.receipt_printed_at = timezone.now()

        payment.save(
            update_fields=[
                "receipt_printed",
                "receipt_printed_by",
                "receipt_printed_at",
                "receipt_reprint_count",
                "updated_at",
            ]
        )

        return Response(
            self.get_serializer(payment).data
        )

    @action(
        detail=True,
        methods=["get"],
        url_path="official-receipt",
    )
    def official_receipt(
        self,
        request,
        pk=None,
    ):
        payment = self.get_object()

        bank_deposit = getattr(
            payment,
            "bank_deposit",
            None,
        )

        return Response(
            {
                "school": {
                    "name": (
                        "Annie T. Doe Memorial "
                        "Foundation High School"
                    ),
                    "document_title": (
                        "Official Receipt"
                    ),
                },
                "receipt": {
                    "receipt_number": (
                        payment.receipt_number
                    ),
                    "student_name": (
                        payment.invoice
                        .student.full_name
                    ),
                    "admission_number": (
                        payment.invoice
                        .student.admission_number
                    ),
                    "invoice_number": (
                        payment.invoice
                        .invoice_number
                    ),
                    "bank_slip_number": (
                        payment.bank_slip_number
                        or (
                            bank_deposit
                            .bank_slip_number
                            if bank_deposit
                            else ""
                        )
                    ),
                    "amount": payment.amount,
                    "payment_date": (
                        payment.paid_at
                    ),
                    "academic_year": (
                        payment.invoice.term
                        .academic_year.name
                    ),
                    "term": (
                        payment.invoice.term.name
                    ),
                    "method": (
                        payment
                        .get_method_display()
                    ),
                    "reference": (
                        payment.reference
                    ),
                    "received_by": (
                        payment.received_by
                        .get_full_name()
                        if payment.received_by
                        else ""
                    ),
                    "printed": (
                        payment.receipt_printed
                    ),
                    "reprint_count": (
                        payment
                        .receipt_reprint_count
                    ),
                },
            }
        )

    def perform_create(self, serializer):
        serializer.save(
            received_by=self.request.user
        )


class ExpenseCategoryViewSet(FinanceBaseViewSet):
    queryset = ExpenseCategory.objects.all()
    serializer_class = ExpenseCategorySerializer

    filter_backends = [
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    search_fields = [
        "name",
        "description",
    ]

    ordering = ["name"]


class ExpenseViewSet(FinanceBaseViewSet):
    serializer_class = ExpenseSerializer

    filter_backends = [
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    search_fields = [
        "expense_number",
        "description",
        "vendor",
        "category__name",
        "reference",
    ]

    ordering_fields = [
        "date",
        "amount",
        "created_at",
    ]

    ordering = ["-date", "-id"]

    def get_queryset(self):
        queryset = (
            Expense.objects
            .select_related(
                "category",
                "recorded_by",
                "approved_by",
            )
            .all()
        )

        category = self.request.query_params.get(
            "category"
        )

        approved = self.request.query_params.get(
            "approved"
        )

        date_from = self.request.query_params.get(
            "date_from"
        )

        date_to = self.request.query_params.get(
            "date_to"
        )

        if category:
            queryset = queryset.filter(
                category_id=category
            )

        if approved in {"true", "false"}:
            queryset = queryset.filter(
                approved=approved == "true"
            )

        if date_from:
            queryset = queryset.filter(
                date__gte=date_from
            )

        if date_to:
            queryset = queryset.filter(
                date__lte=date_to
            )

        return queryset

    def perform_create(self, serializer):
        serializer.save(
            recorded_by=self.request.user
        )

    @action(
        detail=False,
        methods=["post"],
        url_path="approve",
    )
    def approve(self, request):
        expense_ids = request.data.get(
            "expense_ids",
            [],
        )

        if not isinstance(expense_ids, list):
            return Response(
                {
                    "expense_ids": (
                        "Provide expense IDs as a list."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        updated = Expense.objects.filter(
            id__in=expense_ids
        ).update(
            approved=True,
            approved_by=request.user,
        )

        return Response(
            {
                "approved_count": updated,
            }
        )


class SponsorViewSet(FinanceBaseViewSet):
    queryset = Sponsor.objects.all()
    serializer_class = SponsorSerializer

    filter_backends = [
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    search_fields = [
        "name",
        "contact_person",
        "phone",
        "email",
    ]

    ordering = ["name"]


class StudentSponsorshipViewSet(
    FinanceBaseViewSet
):
    serializer_class = StudentSponsorshipSerializer

    filter_backends = [
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    search_fields = [
        "student__admission_number",
        "student__first_name",
        "student__middle_name",
        "student__last_name",
        "sponsor__name",
        "reference_number",
    ]

    ordering = [
        "-academic_year__start_date",
        "student__last_name",
    ]

    def get_queryset(self):
        queryset = (
            StudentSponsorship.objects
            .select_related(
                "student",
                "academic_year",
                "sponsor",
                "recorded_by",
            )
            .all()
        )

        academic_year = self.request.query_params.get(
            "academic_year"
        )

        student = self.request.query_params.get(
            "student"
        )

        sponsor = self.request.query_params.get(
            "sponsor"
        )

        funding_status = (
            self.request.query_params.get(
                "funding_status"
            )
        )

        active = self.request.query_params.get(
            "active"
        )

        if academic_year:
            queryset = queryset.filter(
                academic_year_id=academic_year
            )

        if student:
            queryset = queryset.filter(
                student_id=student
            )

        if sponsor:
            queryset = queryset.filter(
                sponsor_id=sponsor
            )

        if funding_status:
            queryset = queryset.filter(
                funding_status=funding_status
            )

        if active in {"true", "false"}:
            queryset = queryset.filter(
                active=active == "true"
            )

        return queryset

    def perform_create(self, serializer):
        serializer.save(
            recorded_by=self.request.user
        )

    def perform_update(self, serializer):
        serializer.save(
            recorded_by=self.request.user
        )

    @action(
        detail=False,
        methods=["get"],
        url_path="unsponsored-report",
    )
    def unsponsored_report(self, request):
        queryset = self.get_queryset().filter(
            funding_status=(
                StudentSponsorship
                .FundingStatus.UNSPONSORED
            ),
            active=True,
        )

        records = []

        for sponsorship in queryset:
            enrollment = (
                Enrollment.objects
                .select_related(
                    "class_section",
                    "class_section__grade",
                )
                .filter(
                    student=sponsorship.student,
                    academic_year=(
                        sponsorship.academic_year
                    ),
                )
                .first()
            )

            invoices = StudentInvoice.objects.filter(
                student=sponsorship.student,
                term__academic_year=(
                    sponsorship.academic_year
                ),
            )

            total_required = sum(
                (
                    invoice.total_amount
                    for invoice in invoices
                ),
                Decimal("0.00"),
            )

            total_paid = sum(
                (
                    invoice.paid_amount
                    for invoice in invoices
                ),
                Decimal("0.00"),
            )

            records.append(
                {
                    "student_id": (
                        sponsorship.student.id
                    ),
                    "admission_number": (
                        sponsorship.student
                        .admission_number
                    ),
                    "student_name": (
                        sponsorship.student.full_name
                    ),
                    "gender": (
                        sponsorship.student.gender
                    ),
                    "academic_year": (
                        sponsorship.academic_year.name
                    ),
                    "grade": (
                        enrollment.class_section.grade.name
                        if enrollment
                        else ""
                    ),
                    "class_name": (
                        str(enrollment.class_section)
                        if enrollment
                        else ""
                    ),
                    "total_required": float(
                        total_required
                    ),
                    "total_paid": float(
                        total_paid
                    ),
                    "outstanding": float(
                        total_required - total_paid
                    ),
                }
            )

        records.sort(
            key=lambda item: item["outstanding"],
            reverse=True,
        )

        return Response(records)


class BankAccountViewSet(FinanceBaseViewSet):
    queryset = BankAccount.objects.all()
    serializer_class = BankAccountSerializer

    filter_backends = [
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    search_fields = [
        "bank_name",
        "short_name",
        "account_name",
        "account_number",
    ]

    ordering = [
        "bank_name",
        "account_number",
    ]


class BankDepositViewSet(FinanceBaseViewSet):
    serializer_class = BankDepositSerializer

    filter_backends = [
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    search_fields = [
        "bank_slip_number",
        "bank_reference",
        "student_name_on_slip",
        "student__admission_number",
        "student__first_name",
        "student__middle_name",
        "student__last_name",
        "depositor_name",
    ]

    ordering_fields = [
        "payment_date",
        "amount",
        "created_at",
    ]

    ordering = [
        "-payment_date",
        "-created_at",
    ]

    def get_queryset(self):
        queryset = (
            BankDeposit.objects
            .select_related(
                "student",
                "invoice",
                "bank_account",
                "academic_year",
                "term",
                "received_by",
                "verified_by",
                "payment",
            )
            .all()
        )

        academic_year = self.request.query_params.get(
            "academic_year"
        )

        student = self.request.query_params.get(
            "student"
        )

        verification_status = (
            self.request.query_params.get(
                "verification_status"
            )
        )

        sponsorship_status = (
            self.request.query_params.get(
                "sponsorship_status"
            )
        )

        student_category = (
            self.request.query_params.get(
                "student_category"
            )
        )

        date_from = self.request.query_params.get(
            "date_from"
        )

        date_to = self.request.query_params.get(
            "date_to"
        )

        if academic_year:
            queryset = queryset.filter(
                academic_year_id=academic_year
            )

        if student:
            queryset = queryset.filter(
                student_id=student
            )

        if verification_status:
            queryset = queryset.filter(
                verification_status=(
                    verification_status
                )
            )

        if sponsorship_status:
            queryset = queryset.filter(
                sponsorship_status=(
                    sponsorship_status
                )
            )

        if student_category:
            queryset = queryset.filter(
                student_category=student_category
            )

        if date_from:
            queryset = queryset.filter(
                payment_date__gte=date_from
            )

        if date_to:
            queryset = queryset.filter(
                payment_date__lte=date_to
            )

        return queryset

    def perform_create(self, serializer):
        serializer.save(
            received_by=self.request.user,
            verification_status=(
                BankDeposit
                .VerificationStatus.PENDING
            ),
        )

    def generate_receipt_number(self):
        prefix = timezone.now().strftime(
            "ATDMF-RCT-%Y%m%d"
        )

        count = Payment.objects.filter(
            receipt_number__startswith=prefix
        ).count()

        number = count + 1

        receipt = f"{prefix}-{number:04d}"

        while Payment.objects.filter(
            receipt_number=receipt
        ).exists():
            number += 1
            receipt = f"{prefix}-{number:04d}"

        return receipt

    @action(
        detail=True,
        methods=["post"],
        url_path="verify",
    )
    def verify(self, request, pk=None):
        deposit = self.get_object()

        if deposit.verification_status in {
            BankDeposit.VerificationStatus.VERIFIED,
            BankDeposit.VerificationStatus.RECONCILED,
        }:
            return Response(
                {
                    "detail": (
                        "This bank deposit is already verified."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not deposit.invoice:
            return Response(
                {
                    "invoice": (
                        "Link this deposit to a student "
                        "invoice before verification."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if deposit.amount > deposit.invoice.balance:
            return Response(
                {
                    "amount": (
                        "The deposit exceeds the invoice "
                        f"balance of {deposit.invoice.balance}."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            payment = Payment.objects.create(
                invoice=deposit.invoice,
                amount=deposit.amount,
                currency=deposit.currency,
                method=Payment.Method.BANK_DEPOSIT,
                reference=(
                    deposit.bank_reference
                    or deposit.bank_slip_number
                ),
                bank_slip_number=(
                    deposit.bank_slip_number
                ),
                paid_at=timezone.now(),
                received_by=request.user,
                notes=(
                    "Official receipt created from "
                    f"LBDI slip "
                    f"{deposit.bank_slip_number}."
                ),
            )

            deposit.payment = payment

            deposit.verification_status = (
                BankDeposit
                .VerificationStatus.VERIFIED
            )

            deposit.verified_by = request.user
            deposit.verified_at = timezone.now()
            deposit.rejection_reason = ""

            deposit.save(
                update_fields=[
                    "payment",
                    "verification_status",
                    "verified_by",
                    "verified_at",
                    "rejection_reason",
                    "updated_at",
                ]
            )

        return Response(
            self.get_serializer(deposit).data
        )

    @action(
        detail=True,
        methods=["post"],
        url_path="reject",
    )
    def reject(self, request, pk=None):
        deposit = self.get_object()

        if deposit.payment_id:
            return Response(
                {
                    "detail": (
                        "A deposit that already created a "
                        "payment cannot be rejected."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        reason = request.data.get(
            "reason",
            "",
        ).strip()

        if not reason:
            return Response(
                {
                    "reason": (
                        "A rejection reason is required."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        deposit.verification_status = (
            BankDeposit
            .VerificationStatus.REJECTED
        )

        deposit.rejection_reason = reason
        deposit.verified_by = request.user
        deposit.verified_at = timezone.now()

        deposit.save(
            update_fields=[
                "verification_status",
                "rejection_reason",
                "verified_by",
                "verified_at",
                "updated_at",
            ]
        )

        return Response(
            self.get_serializer(deposit).data
        )

    @action(
        detail=True,
        methods=["post"],
        url_path="reconcile",
    )
    def reconcile(self, request, pk=None):
        deposit = self.get_object()

        if not deposit.payment_id:
            return Response(
                {
                    "detail": (
                        "Verify this bank deposit before "
                        "marking it as reconciled."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        deposit.verification_status = (
            BankDeposit
            .VerificationStatus.RECONCILED
        )

        deposit.verified_by = request.user
        deposit.verified_at = timezone.now()

        deposit.save(
            update_fields=[
                "verification_status",
                "verified_by",
                "verified_at",
                "updated_at",
            ]
        )

        return Response(
            self.get_serializer(deposit).data
        )

    @action(
        detail=False,
        methods=["get"],
        url_path="summary",
    )
    def summary(self, request):
        queryset = self.get_queryset()

        total_amount = (
            queryset.aggregate(
                total=Sum("amount")
            )["total"]
            or Decimal("0.00")
        )

        return Response(
            {
                "total_deposits": queryset.count(),
                "total_amount": float(total_amount),

                "pending": queryset.filter(
                    verification_status=(
                        BankDeposit
                        .VerificationStatus.PENDING
                    )
                ).count(),

                "verified": queryset.filter(
                    verification_status=(
                        BankDeposit
                        .VerificationStatus.VERIFIED
                    )
                ).count(),

                "rejected": queryset.filter(
                    verification_status=(
                        BankDeposit
                        .VerificationStatus.REJECTED
                    )
                ).count(),

                "reconciled": queryset.filter(
                    verification_status=(
                        BankDeposit
                        .VerificationStatus.RECONCILED
                    )
                ).count(),

                "sponsored": queryset.filter(
                    sponsorship_status=(
                        BankDeposit
                        .SponsorshipStatus.SPONSORED
                    )
                ).count(),

                "partially_sponsored": queryset.filter(
                    sponsorship_status=(
                        BankDeposit
                        .SponsorshipStatus
                        .PARTIALLY_SPONSORED
                    )
                ).count(),

                "unsponsored": queryset.filter(
                    sponsorship_status=(
                        BankDeposit
                        .SponsorshipStatus.UNSPONSORED
                    )
                ).count(),

                "new_students": queryset.filter(
                    student_category=(
                        BankDeposit.StudentCategory.NEW
                    )
                ).count(),

                "returning_students": queryset.filter(
                    student_category=(
                        BankDeposit
                        .StudentCategory.RETURNING
                    )
                ).count(),
            }
        )


class FinanceReportViewSet(viewsets.ViewSet):
    permission_classes = [
        permissions.IsAuthenticated,
    ]

    @action(
        detail=False,
        methods=["get"],
        url_path="dashboard",
    )
    def dashboard(self, request):
        academic_year = request.query_params.get(
            "academic_year"
        )

        invoices = StudentInvoice.objects.all()
        payments = Payment.objects.all()
        expenses = Expense.objects.filter(
            approved=True
        )

        deposits = BankDeposit.objects.all()

        if academic_year:
            invoices = invoices.filter(
                term__academic_year_id=academic_year
            )

            payments = payments.filter(
                invoice__term__academic_year_id=(
                    academic_year
                )
            )

            deposits = deposits.filter(
                academic_year_id=academic_year
            )

        invoiced = (
            invoices.aggregate(
                total=Sum("total_amount")
            )["total"]
            or Decimal("0.00")
        )

        collected = (
            payments.aggregate(
                total=Sum("amount")
            )["total"]
            or Decimal("0.00")
        )

        expense_total = (
            expenses.aggregate(
                total=Sum("amount")
            )["total"]
            or Decimal("0.00")
        )

        pending_bank_amount = (
            deposits.filter(
                verification_status=(
                    BankDeposit
                    .VerificationStatus.PENDING
                )
            ).aggregate(
                total=Sum("amount")
            )["total"]
            or Decimal("0.00")
        )

        return Response(
            {
                "invoiced": float(invoiced),
                "collected": float(collected),
                "outstanding": float(
                    invoiced - collected
                ),
                "expenses": float(expense_total),
                "net_income": float(
                    collected - expense_total
                ),
                "invoice_count": invoices.count(),
                "payment_count": payments.count(),
                "bank_deposit_count": deposits.count(),
                "pending_bank_deposits": (
                    deposits.filter(
                        verification_status=(
                            BankDeposit
                            .VerificationStatus.PENDING
                        )
                    ).count()
                ),
                "pending_bank_amount": float(
                    pending_bank_amount
                ),
                "verified_bank_deposits": (
                    deposits.filter(
                        verification_status__in=[
                            BankDeposit
                            .VerificationStatus.VERIFIED,
                            BankDeposit
                            .VerificationStatus.RECONCILED,
                        ]
                    ).count()
                ),
            }
        )

    @action(
        detail=False,
        methods=["get"],
        url_path="outstanding-students",
    )
    def outstanding_students(self, request):
        academic_year = request.query_params.get(
            "academic_year"
        )

        invoices = (
            StudentInvoice.objects
            .select_related(
                "student",
                "term",
                "term__academic_year",
            )
            .prefetch_related("payments")
            .all()
        )

        if academic_year:
            invoices = invoices.filter(
                term__academic_year_id=academic_year
            )

        records = []

        for invoice in invoices:
            if invoice.balance <= Decimal("0.00"):
                continue

            records.append(
                {
                    "invoice_id": invoice.id,
                    "invoice_number": (
                        invoice.invoice_number
                    ),
                    "student_id": invoice.student.id,
                    "admission_number": (
                        invoice.student
                        .admission_number
                    ),
                    "student_name": (
                        invoice.student.full_name
                    ),
                    "term_name": invoice.term.name,
                    "academic_year_name": (
                        invoice.term
                        .academic_year.name
                    ),
                    "total_amount": float(
                        invoice.total_amount
                    ),
                    "paid_amount": float(
                        invoice.paid_amount
                    ),
                    "balance": float(
                        invoice.balance
                    ),
                    "due_date": invoice.due_date,
                }
            )

        records.sort(
            key=lambda item: item["balance"],
            reverse=True,
        )

        return Response(records)
class BankStatementViewSet(
    FinanceBaseViewSet
):
    serializer_class = BankStatementSerializer

    filter_backends = [
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    search_fields = [
        "statement_number",
        "bank_account__bank_name",
        "bank_account__account_number",
    ]

    ordering = [
        "-week_end_date",
        "-uploaded_at",
    ]

    def get_queryset(self):
        queryset = (
            BankStatement.objects
            .select_related(
                "bank_account",
                "uploaded_by",
                "reconciled_by",
            )
            .all()
        )

        status_value = (
            self.request.query_params.get(
                "status"
            )
        )

        bank_account = (
            self.request.query_params.get(
                "bank_account"
            )
        )

        if status_value:
            queryset = queryset.filter(
                status=status_value
            )

        if bank_account:
            queryset = queryset.filter(
                bank_account_id=bank_account
            )

        return queryset

    def perform_create(self, serializer):
        serializer.save(
            uploaded_by=self.request.user,
            status=(
                BankStatement.Status.UPLOADED
            ),
        )

    @action(
        detail=True,
        methods=["post"],
        url_path="auto-match",
    )
    def auto_match(self, request, pk=None):
        statement = self.get_object()

        transactions = (
            statement.transactions
            .filter(
                match_status=(
                    BankStatementTransaction
                    .MatchStatus.UNMATCHED
                )
            )
        )

        matched_count = 0
        unmatched_count = 0
        duplicate_count = 0

        for transaction_record in transactions:
            deposit_matches = (
                BankDeposit.objects
                .filter(
                    amount=(
                        transaction_record.amount
                    )
                )
            )

            if (
                transaction_record
                .bank_slip_number
            ):
                deposit_matches = (
                    deposit_matches.filter(
                        bank_slip_number=(
                            transaction_record
                            .bank_slip_number
                        )
                    )
                )
            elif (
                transaction_record
                .bank_reference
            ):
                deposit_matches = (
                    deposit_matches.filter(
                        bank_reference=(
                            transaction_record
                            .bank_reference
                        )
                    )
                )
            else:
                deposit_matches = (
                    deposit_matches.filter(
                        payment_date=(
                            transaction_record
                            .transaction_date
                        )
                    )
                )

            match_count = deposit_matches.count()

            if match_count == 1:
                deposit = deposit_matches.first()

                transaction_record.matched_bank_deposit = (
                    deposit
                )
                transaction_record.matched_payment = (
                    deposit.payment
                )
                transaction_record.match_status = (
                    BankStatementTransaction
                    .MatchStatus.MATCHED
                )
                transaction_record.matched_by = (
                    request.user
                )
                transaction_record.matched_at = (
                    timezone.now()
                )

                transaction_record.save()

                deposit.verification_status = (
                    BankDeposit
                    .VerificationStatus.RECONCILED
                )
                deposit.save(
                    update_fields=[
                        "verification_status",
                        "updated_at",
                    ]
                )

                if deposit.payment:
                    deposit.payment.verified_against_statement = (
                        True
                    )
                    deposit.payment.statement_verified_at = (
                        timezone.now()
                    )
                    deposit.payment.statement_verified_by = (
                        request.user
                    )
                    deposit.payment.save(
                        update_fields=[
                            "verified_against_statement",
                            "statement_verified_at",
                            "statement_verified_by",
                            "updated_at",
                        ]
                    )

                matched_count += 1

            elif match_count > 1:
                transaction_record.match_status = (
                    BankStatementTransaction
                    .MatchStatus.DUPLICATE
                )
                transaction_record.save(
                    update_fields=[
                        "match_status"
                    ]
                )

                duplicate_count += 1

            else:
                transaction_record.match_status = (
                    BankStatementTransaction
                    .MatchStatus.MANUAL_REVIEW
                )
                transaction_record.save(
                    update_fields=[
                        "match_status"
                    ]
                )

                unmatched_count += 1

        statement.total_transactions = (
            statement.transactions.count()
        )

        statement.matched_transactions = (
            statement.transactions.filter(
                match_status=(
                    BankStatementTransaction
                    .MatchStatus.MATCHED
                )
            ).count()
        )

        statement.unmatched_transactions = (
            statement.transactions.exclude(
                match_status=(
                    BankStatementTransaction
                    .MatchStatus.MATCHED
                )
            ).count()
        )

        statement.duplicate_transactions = (
            statement.transactions.filter(
                match_status=(
                    BankStatementTransaction
                    .MatchStatus.DUPLICATE
                )
            ).count()
        )

        if statement.unmatched_transactions == 0:
            statement.status = (
                BankStatement.Status.RECONCILED
            )
            statement.reconciled_by = request.user
            statement.reconciled_at = (
                timezone.now()
            )
        else:
            statement.status = (
                BankStatement
                .Status.REVIEW_REQUIRED
            )

        statement.save()

        return Response(
            {
                "matched": matched_count,
                "unmatched": unmatched_count,
                "duplicates": duplicate_count,
                "statement": (
                    self.get_serializer(
                        statement
                    ).data
                ),
            }
        )


class BankStatementTransactionViewSet(
    FinanceBaseViewSet
):
    serializer_class = (
        BankStatementTransactionSerializer
    )

    filter_backends = [
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    search_fields = [
        "bank_slip_number",
        "bank_reference",
        "depositor_name",
        "description",
    ]

    ordering = [
        "transaction_date",
        "id",
    ]

    def get_queryset(self):
        queryset = (
            BankStatementTransaction.objects
            .select_related(
                "statement",
                "matched_bank_deposit",
                "matched_bank_deposit__student",
                "matched_payment",
                "matched_by",
            )
            .all()
        )

        statement = (
            self.request.query_params.get(
                "statement"
            )
        )

        match_status = (
            self.request.query_params.get(
                "match_status"
            )
        )

        if statement:
            queryset = queryset.filter(
                statement_id=statement
            )

        if match_status:
            queryset = queryset.filter(
                match_status=match_status
            )

        return queryset