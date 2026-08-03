from rest_framework import serializers

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


class FeeTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = FeeType
        fields = "__all__"


class FeeStructureSerializer(serializers.ModelSerializer):
    fee_type_name = serializers.CharField(
        source="fee_type.name",
        read_only=True,
    )

    grade_name = serializers.CharField(
        source="grade.name",
        read_only=True,
    )

    academic_year_name = serializers.CharField(
        source="academic_year.name",
        read_only=True,
    )

    term_name = serializers.CharField(
        source="term.name",
        read_only=True,
    )

    class Meta:
        model = FeeStructure
        fields = "__all__"


class InvoiceSerializer(serializers.ModelSerializer):
    paid_amount = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        read_only=True,
    )

    balance = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        read_only=True,
    )

    student_name = serializers.CharField(
        source="student.full_name",
        read_only=True,
    )

    admission_number = serializers.CharField(
        source="student.admission_number",
        read_only=True,
    )

    term_name = serializers.CharField(
        source="term.name",
        read_only=True,
    )

    academic_year = serializers.IntegerField(
        source="term.academic_year.id",
        read_only=True,
    )

    academic_year_name = serializers.CharField(
        source="term.academic_year.name",
        read_only=True,
    )

    class Meta:
        model = StudentInvoice
        fields = "__all__"


class PaymentSerializer(serializers.ModelSerializer):
    invoice_number = serializers.CharField(
        source="invoice.invoice_number",
        read_only=True,
    )

    student_name = serializers.CharField(
        source="invoice.student.full_name",
        read_only=True,
    )

    admission_number = serializers.CharField(
        source="invoice.student.admission_number",
        read_only=True,
    )

    method_display = serializers.CharField(
        source="get_method_display",
        read_only=True,
    )

    received_by_name = serializers.SerializerMethodField()

    receipt_printed_by_name = (
        serializers.SerializerMethodField()
    )

    statement_verified_by_name = (
        serializers.SerializerMethodField()
    )

    class Meta:
        model = Payment
        fields = "__all__"

        read_only_fields = [
            "receipt_number",
            "received_by",
            "receipt_printed",
            "receipt_printed_by",
            "receipt_printed_at",
            "receipt_reprint_count",
            "verified_against_statement",
            "statement_verified_at",
            "statement_verified_by",
        ]

    def get_received_by_name(self, obj):
        if not obj.received_by:
            return ""

        return (
            obj.received_by.get_full_name()
            or obj.received_by.username
        )

    def get_receipt_printed_by_name(self, obj):
        if not obj.receipt_printed_by:
            return ""

        return (
            obj.receipt_printed_by.get_full_name()
            or obj.receipt_printed_by.username
        )

    def get_statement_verified_by_name(
        self,
        obj,
    ):
        if not obj.statement_verified_by:
            return ""

        return (
            obj.statement_verified_by.get_full_name()
            or obj.statement_verified_by.username
        )


class ExpenseCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ExpenseCategory
        fields = "__all__"


class ExpenseSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(
        source="category.name",
        read_only=True,
    )

    recorded_by_name = serializers.SerializerMethodField()
    approved_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Expense
        fields = "__all__"

        read_only_fields = [
            "expense_number",
            "recorded_by",
            "approved_by",
            "approved",
        ]

    def get_recorded_by_name(self, obj):
        if not obj.recorded_by:
            return ""

        full_name = obj.recorded_by.get_full_name()

        return full_name or obj.recorded_by.username

    def get_approved_by_name(self, obj):
        if not obj.approved_by:
            return ""

        full_name = obj.approved_by.get_full_name()

        return full_name or obj.approved_by.username


class SponsorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sponsor
        fields = "__all__"


class StudentSponsorshipSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(
        source="student.full_name",
        read_only=True,
    )

    admission_number = serializers.CharField(
        source="student.admission_number",
        read_only=True,
    )

    academic_year_name = serializers.CharField(
        source="academic_year.name",
        read_only=True,
    )

    sponsor_name = serializers.SerializerMethodField()

    funding_status_display = serializers.CharField(
        source="get_funding_status_display",
        read_only=True,
    )

    coverage_type_display = serializers.CharField(
        source="get_coverage_type_display",
        read_only=True,
    )

    recorded_by_name = serializers.SerializerMethodField()

    class Meta:
        model = StudentSponsorship
        fields = "__all__"

        read_only_fields = [
            "recorded_by",
        ]

    def get_sponsor_name(self, obj):
        return obj.sponsor.name if obj.sponsor else ""

    def get_recorded_by_name(self, obj):
        if not obj.recorded_by:
            return ""

        full_name = obj.recorded_by.get_full_name()

        return full_name or obj.recorded_by.username


class BankAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = BankAccount
        fields = "__all__"


class BankDepositSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(
        source="student.full_name",
        read_only=True,
    )

    admission_number = serializers.CharField(
        source="student.admission_number",
        read_only=True,
    )

    invoice_number = serializers.SerializerMethodField()
    invoice_balance = serializers.SerializerMethodField()

    bank_name = serializers.CharField(
        source="bank_account.bank_name",
        read_only=True,
    )

    account_number = serializers.CharField(
        source="bank_account.account_number",
        read_only=True,
    )

    academic_year_name = serializers.CharField(
        source="academic_year.name",
        read_only=True,
    )

    term_name = serializers.SerializerMethodField()

    received_by_name = serializers.SerializerMethodField()
    verified_by_name = serializers.SerializerMethodField()

    verification_status_display = serializers.CharField(
        source="get_verification_status_display",
        read_only=True,
    )

    student_category_display = serializers.CharField(
        source="get_student_category_display",
        read_only=True,
    )

    sponsorship_status_display = serializers.CharField(
        source="get_sponsorship_status_display",
        read_only=True,
    )

    receipt_number = serializers.SerializerMethodField()

    class Meta:
        model = BankDeposit
        fields = "__all__"

        read_only_fields = [
            "received_by",
            "verified_by",
            "verified_at",
            "payment",
            "verification_status",
            "rejection_reason",
        ]

    def get_invoice_number(self, obj):
        return (
            obj.invoice.invoice_number
            if obj.invoice
            else ""
        )

    def get_invoice_balance(self, obj):
        return (
            obj.invoice.balance
            if obj.invoice
            else None
        )

    def get_term_name(self, obj):
        return obj.term.name if obj.term else ""

    def get_received_by_name(self, obj):
        if not obj.received_by:
            return ""

        full_name = obj.received_by.get_full_name()

        return full_name or obj.received_by.username

    def get_verified_by_name(self, obj):
        if not obj.verified_by:
            return ""

        full_name = obj.verified_by.get_full_name()

        return full_name or obj.verified_by.username

    def get_receipt_number(self, obj):
        return (
            obj.payment.receipt_number
            if obj.payment
            else ""
        )
class BankStatementSerializer(
    serializers.ModelSerializer
):
    bank_name = serializers.CharField(
        source="bank_account.bank_name",
        read_only=True,
    )

    account_number = serializers.CharField(
        source="bank_account.account_number",
        read_only=True,
    )

    uploaded_by_name = (
        serializers.SerializerMethodField()
    )

    reconciled_by_name = (
        serializers.SerializerMethodField()
    )

    class Meta:
        model = BankStatement
        fields = "__all__"

        read_only_fields = [
            "file_type",
            "status",
            "total_transactions",
            "matched_transactions",
            "unmatched_transactions",
            "duplicate_transactions",
            "total_statement_amount",
            "uploaded_by",
            "reconciled_by",
            "reconciled_at",
        ]

    def get_uploaded_by_name(self, obj):
        if not obj.uploaded_by:
            return ""

        return (
            obj.uploaded_by.get_full_name()
            or obj.uploaded_by.username
        )

    def get_reconciled_by_name(self, obj):
        if not obj.reconciled_by:
            return ""

        return (
            obj.reconciled_by.get_full_name()
            or obj.reconciled_by.username
        )


class BankStatementTransactionSerializer(
    serializers.ModelSerializer
):
    matched_student_name = (
        serializers.SerializerMethodField()
    )

    matched_receipt_number = (
        serializers.SerializerMethodField()
    )

    class Meta:
        model = BankStatementTransaction
        fields = "__all__"

        read_only_fields = [
            "matched_bank_deposit",
            "matched_payment",
            "matched_by",
            "matched_at",
        ]

    def get_matched_student_name(self, obj):
        if not obj.matched_bank_deposit:
            return ""

        return (
            obj.matched_bank_deposit
            .student.full_name
        )

    def get_matched_receipt_number(self, obj):
        if not obj.matched_payment:
            return ""

        return obj.matched_payment.receipt_number