from django.contrib import admin
from .models import *
admin.site.register([FeeType,FeeStructure,StudentInvoice,Payment,Expense])
from .models import (
    BankAccount,
    BankDeposit,
    Sponsor,
    StudentSponsorship,
)
from .models import (
    BankStatement,
    BankStatementTransaction,
)

@admin.register(Sponsor)
class SponsorAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "sponsor_type",
        "contact_person",
        "phone",
        "email",
        "active",
    )

    list_filter = (
        "sponsor_type",
        "active",
    )

    search_fields = (
        "name",
        "contact_person",
        "phone",
        "email",
    )


@admin.register(StudentSponsorship)
class StudentSponsorshipAdmin(admin.ModelAdmin):
    list_display = (
        "student",
        "academic_year",
        "funding_status",
        "sponsor",
        "coverage_type",
        "coverage_value",
        "active",
    )

    list_filter = (
        "academic_year",
        "funding_status",
        "coverage_type",
        "active",
    )

    search_fields = (
        "student__admission_number",
        "student__first_name",
        "student__last_name",
        "sponsor__name",
    )


@admin.register(BankAccount)
class BankAccountAdmin(admin.ModelAdmin):
    list_display = (
        "bank_name",
        "short_name",
        "account_name",
        "account_number",
        "currency",
        "active",
    )

    list_filter = (
        "currency",
        "active",
    )

    search_fields = (
        "bank_name",
        "account_name",
        "account_number",
    )


@admin.register(BankDeposit)
class BankDepositAdmin(admin.ModelAdmin):
    list_display = (
        "bank_slip_number",
        "student_name_on_slip",
        "student",
        "payment_date",
        "amount",
        "currency",
        "student_category",
        "sponsorship_status",
        "verification_status",
        "received_by",
    )

    list_filter = (
        "academic_year",
        "student_category",
        "sponsorship_status",
        "verification_status",
        "bank_account",
        "payment_date",
    )

    search_fields = (
        "bank_slip_number",
        "bank_reference",
        "student_name_on_slip",
        "student__admission_number",
        "student__first_name",
        "student__last_name",
        "depositor_name",
    )

    readonly_fields = (
        "payment",
        "received_by",
        "verified_by",
        "verified_at",
        "created_at",
        "updated_at",
    )
class BankStatementTransactionInline(
    admin.TabularInline
):
    model = BankStatementTransaction
    extra = 0

    readonly_fields = (
        "transaction_date",
        "bank_slip_number",
        "bank_reference",
        "depositor_name",
        "amount",
        "match_status",
        "matched_bank_deposit",
        "matched_payment",
        "matched_by",
        "matched_at",
    )


@admin.register(BankStatement)
class BankStatementAdmin(admin.ModelAdmin):
    list_display = (
        "bank_account",
        "week_start_date",
        "week_end_date",
        "status",
        "total_transactions",
        "matched_transactions",
        "unmatched_transactions",
        "uploaded_by",
        "uploaded_at",
    )

    list_filter = (
        "status",
        "bank_account",
        "week_start_date",
        "week_end_date",
    )

    search_fields = (
        "statement_number",
        "bank_account__bank_name",
        "bank_account__account_number",
    )

    readonly_fields = (
        "file_type",
        "total_transactions",
        "matched_transactions",
        "unmatched_transactions",
        "duplicate_transactions",
        "total_statement_amount",
        "uploaded_by",
        "uploaded_at",
        "reconciled_by",
        "reconciled_at",
    )

    inlines = [
        BankStatementTransactionInline,
    ]


@admin.register(
    BankStatementTransaction
)
class BankStatementTransactionAdmin(
    admin.ModelAdmin
):
    list_display = (
        "statement",
        "transaction_date",
        "bank_slip_number",
        "bank_reference",
        "amount",
        "match_status",
        "matched_bank_deposit",
        "matched_payment",
    )

    list_filter = (
        "match_status",
        "transaction_date",
        "statement",
    )

    search_fields = (
        "bank_slip_number",
        "bank_reference",
        "depositor_name",
        "description",
    )