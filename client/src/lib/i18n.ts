type Translation = {
  [key: string]: {
    en: string;
    ar: string;
  };
};

export const translations: Translation = {
  // Common
  "Charity Tracking": {
    en: "Charity Tracking",
    ar: "تتبع الأعمال الخيرية"
  },
  "language": {
    en: "العربية",
    ar: "English"
  },
  "search": {
    en: "Search",
    ar: "بحث"
  },
  "searchMembers": {
    en: "Search members...",
    ar: "البحث عن أعضاء..."
  },
  "searchInitiatives": {
    en: "Search initiatives...",
    ar: "البحث عن مبادرات..."
  },
  "searchCategories": {
    en: "Search categories...",
    ar: "البحث عن فئات..."
  },
  "save": {
    en: "Save",
    ar: "حفظ"
  },
  "Saving...": {
    en: "Saving...",
    ar: "جاري الحفظ..."
  },
  "cancel": {
    en: "Cancel",
    ar: "إلغاء"
  },
  "edit": {
    en: "Edit",
    ar: "تعديل"
  },
  "delete": {
    en: "Delete",
    ar: "حذف"
  },
  "Confirm Deletion": {
    en: "Confirm Deletion",
    ar: "تأكيد الحذف"
  },
  "Are you sure you want to remove this member from the initiative? This action cannot be undone.": {
    en: "Are you sure you want to remove this member from the initiative? This action cannot be undone.",
    ar: "هل أنت متأكد من إزالة هذا العضو من المبادرة؟ لا يمكن التراجع عن هذا الإجراء."
  },
  "Success": {
    en: "Success",
    ar: "نجاح"
  },
  "Error": {
    en: "Error",
    ar: "خطأ"
  },
  "Member added successfully": {
    en: "Member added successfully",
    ar: "تمت إضافة العضو بنجاح"
  },
  "Member updated successfully": {
    en: "Member updated successfully",
    ar: "تم تحديث العضو بنجاح"
  },
  "Category added successfully": {
    en: "Category added successfully",
    ar: "تمت إضافة الفئة بنجاح"
  },
  "Initiative added successfully": {
    en: "Initiative added successfully",
    ar: "تمت إضافة المبادرة بنجاح"
  },
  "Initiative updated successfully": {
    en: "Initiative updated successfully",
    ar: "تم تحديث المبادرة بنجاح"
  },
  "Member connected to initiative successfully": {
    en: "Member connected to initiative successfully",
    ar: "تم ربط العضو بالمبادرة بنجاح"
  },
  "Member removed from initiative": {
    en: "Member removed from initiative",
    ar: "تمت إزالة العضو من المبادرة"
  },
  "Donation successful": {
    en: "Donation successful",
    ar: "تم التبرع بنجاح"
  },
  "Deposit successful": {
    en: "Deposit successful",
    ar: "تم الإيداع بنجاح"
  },
  "Withdrawal successful": {
    en: "Withdrawal successful",
    ar: "تم السحب بنجاح"
  },
  "No data available": {
    en: "No data available",
    ar: "لا توجد بيانات متاحة"
  },
  "No results found": {
    en: "No results found",
    ar: "لا توجد نتائج"
  },
  "No donor data available yet": {
    en: "No donor data available yet",
    ar: "لا توجد بيانات للمتبرعين بعد"
  },
  "This must be unique": {
    en: "This must be unique",
    ar: "يجب أن يكون فريدًا"
  },
  "This must be unique across all members": {
    en: "This must be unique across all members",
    ar: "يجب أن يكون فريدًا بين جميع الأعضاء"
  },
  "Optional": {
    en: "Optional",
    ar: "اختياري"
  },
  "Select a category": {
    en: "Select a category",
    ar: "اختر فئة"
  },
  "Select a role": {
    en: "Select a role",
    ar: "اختر دورًا"
  },
  "Select member": {
    en: "Select member",
    ar: "اختر عضوًا"
  },
  "No members found": {
    en: "No members found",
    ar: "لم يتم العثور على أعضاء"
  },
  "No initiatives found": {
    en: "No initiatives found",
    ar: "لم يتم العثور على مبادرات"
  },

  // Navigation
  "dashboard": {
    en: "Dashboard",
    ar: "لوحة المعلومات"
  },
  "members": {
    en: "Members",
    ar: "الأعضاء"
  },
  "categories": {
    en: "Categories",
    ar: "الفئات"
  },
  "initiatives": {
    en: "Initiatives",
    ar: "المبادرات"
  },
  "vault": {
    en: "Vault",
    ar: "الخزنة"
  },
  "reports": {
    en: "Reports",
    ar: "التقارير"
  },

  // Members
  "addMember": {
    en: "Add Member",
    ar: "إضافة عضو"
  },
  "editMember": {
    en: "Edit Member",
    ar: "تعديل العضو"
  },
  "memberDetails": {
    en: "Member Details",
    ar: "تفاصيل العضو"
  },
  "firstName": {
    en: "First Name",
    ar: "الاسم الأول"
  },
  "lastName": {
    en: "Last Name",
    ar: "اسم العائلة"
  },
  "phoneNumber": {
    en: "Phone Number",
    ar: "رقم الهاتف"
  },
  "address": {
    en: "Address",
    ar: "العنوان"
  },
  "createdDate": {
    en: "Created Date",
    ar: "تاريخ الإنشاء"
  },
  "totalDonations": {
    en: "Total Donations",
    ar: "إجمالي التبرعات"
  },
  "totalBeneficiaries": {
    en: "Total Beneficiaries",
    ar: "إجمالي المستفيدين"
  },
  "mostRecentRole": {
    en: "Most Recent Role",
    ar: "الدور الأخير"
  },
  "totalMembers": {
    en: "Total Members",
    ar: "إجمالي الأعضاء"
  },
  "memberInitiatives": {
    en: "Member Initiatives",
    ar: "مبادرات العضو"
  },
  "donations": {
    en: "{{count}} donations",
    ar: "{{count}} تبرعات"
  },

  // Categories
  "addCategory": {
    en: "Add Category",
    ar: "إضافة فئة"
  },
  "categoryName": {
    en: "Category Name",
    ar: "اسم الفئة"
  },
  "initiativesCount": {
    en: "{{count}} Initiatives",
    ar: "{{count}} مبادرات"
  },

  // Initiatives
  "addInitiative": {
    en: "Add Initiative",
    ar: "إضافة مبادرة"
  },
  "editInitiative": {
    en: "Edit Initiative",
    ar: "تعديل المبادرة"
  },
  "initiativeDetails": {
    en: "Initiative Details",
    ar: "تفاصيل المبادرة"
  },
  "initiativeTitle": {
    en: "Initiative Title",
    ar: "عنوان المبادرة"
  },
  "title": {
    en: "Title",
    ar: "العنوان"
  },
  "category": {
    en: "Category",
    ar: "الفئة"
  },
  "description": {
    en: "Description",
    ar: "الوصف"
  },
  "status": {
    en: "Status",
    ar: "الحالة"
  },
  "active": {
    en: "Active",
    ar: "نشط"
  },
  "upcoming": {
    en: "Upcoming",
    ar: "قادم"
  },
  "ended": {
    en: "Ended",
    ar: "انتهى"
  },
  "startingDate": {
    en: "Starting Date",
    ar: "تاريخ البدء"
  },
  "endingDate": {
    en: "Ending Date",
    ar: "تاريخ الانتهاء"
  },
  "donationsGoal": {
    en: "Donations Goal",
    ar: "هدف التبرعات"
  },
  "connectMember": {
    en: "Connect Member",
    ar: "ربط عضو"
  },
  "initiativeMembers": {
    en: "Initiative Members",
    ar: "أعضاء المبادرة"
  },
  "searchMember": {
    en: "Search Member",
    ar: "البحث عن عضو"
  },
  "member": {
    en: "Member",
    ar: "عضو"
  },
  "donorsCount": {
    en: "Donors Count",
    ar: "عدد المتبرعين"
  },
  "beneficiariesCount": {
    en: "Beneficiaries Count",
    ar: "عدد المستفيدين"
  },
  "donors": {
    en: "donors",
    ar: "متبرعين"
  },
  "beneficiaries": {
    en: "beneficiaries",
    ar: "مستفيدين"
  },

  // Roles
  "role": {
    en: "Role",
    ar: "الدور"
  },
  "donor": {
    en: "Donor",
    ar: "متبرع"
  },
  "beneficiary": {
    en: "Beneficiary",
    ar: "مستفيد"
  },
  "participationDate": {
    en: "Participation Date",
    ar: "تاريخ المشاركة"
  },

  // Vault
  "vaultBalance": {
    en: "Vault Balance",
    ar: "رصيد الخزنة"
  },
  "donate": {
    en: "Donate",
    ar: "تبرع"
  },
  "donateToInitiative": {
    en: "Donate to Initiative",
    ar: "تبرع لمبادرة"
  },
  "deposit": {
    en: "Deposit",
    ar: "إيداع"
  },
  "vaultDeposit": {
    en: "Vault Deposit",
    ar: "إيداع في الخزنة"
  },
  "withdraw": {
    en: "Withdraw",
    ar: "سحب"
  },
  "vaultWithdraw": {
    en: "Vault Withdraw",
    ar: "سحب من الخزنة"
  },
  "amount": {
    en: "Amount",
    ar: "المبلغ"
  },
  "donationAmount": {
    en: "Donation Amount",
    ar: "مبلغ التبرع"
  },
  "transactions": {
    en: "Transactions",
    ar: "المعاملات"
  },
  "type": {
    en: "Type",
    ar: "النوع"
  },
  // Types of transactions are already defined above
  
  "donation": {
    en: "Donation",
    ar: "تبرع"
  },
  "surplus": {
    en: "Surplus",
    ar: "فائض"
  },
  "balance": {
    en: "Balance",
    ar: "الرصيد"
  },
  "Cannot exceed current vault balance": {
    en: "Cannot exceed current vault balance",
    ar: "لا يمكن أن يتجاوز رصيد الخزنة الحالي"
  },
  "Select initiative": {
    en: "Select initiative",
    ar: "اختر مبادرة"
  },
  "searchInitiative": {
    en: "Search Initiative",
    ar: "البحث عن مبادرة"
  },

  // Dashboard
  "topDonors": {
    en: "Top Donors",
    ar: "أكبر المتبرعين"
  },
  "currentInitiatives": {
    en: "Current Initiatives",
    ar: "المبادرات الحالية"
  },
  "donationsOverview": {
    en: "Donations Overview",
    ar: "نظرة عامة على التبرعات"
  },
  "current": {
    en: "Current",
    ar: "الحالي"
  },
  "goal": {
    en: "Goal",
    ar: "الهدف"
  },
  "ID": {
    en: "ID",
    ar: "المعرف"
  },
  "actions": {
    en: "Actions",
    ar: "الإجراءات"
  },
  "date": {
    en: "Date",
    ar: "التاريخ"
  },
  
  // Reports
  "filters": {
    en: "Filters",
    ar: "تصفية"
  },
  "minAmount": {
    en: "Min Amount",
    ar: "الحد الأدنى للمبلغ"
  },
  "maxAmount": {
    en: "Max Amount",
    ar: "الحد الأقصى للمبلغ"
  },
  "selectDate": {
    en: "Select date",
    ar: "اختر تاريخ"
  },
  "applyFilters": {
    en: "Apply Filters",
    ar: "تطبيق التصفية"
  },
  "results": {
    en: "Results",
    ar: "النتائج"
  },
  "exportToExcel": {
    en: "Export to Excel",
    ar: "تصدير إلى إكسل"
  },
  "all": {
    en: "All",
    ar: "الكل"
  },
  "selectStatus": {
    en: "Select status",
    ar: "اختر الحالة"
  },
  "reset": {
    en: "Reset",
    ar: "إعادة ضبط"
  },
  "initiative": {
    en: "Initiative",
    ar: "مبادرة"
  },
  "selectInitiative": {
    en: "Select initiative",
    ar: "اختر مبادرة"
  },
  "selectMember": {
    en: "Select member",
    ar: "اختر عضو"
  }
};

export function translate(key: string, options?: Record<string, any>, language?: string): string {
  const selectedLanguage = language || localStorage.getItem('appLanguage') || 'en';
  
  const translation = translations[key];
  
  if (!translation) {
    // Return the key if translation not found
    console.log(`Translation not found for key: ${key}`);
    return key;
  }
  
  let result = translation[selectedLanguage as keyof typeof translation] || key;
  
  // Handle options like {{count}}
  if (options) {
    Object.keys(options).forEach(optionKey => {
      result = result.replace(`{{${optionKey}}}`, options[optionKey]);
    });
  }
  
  return result;
}
