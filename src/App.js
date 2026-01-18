import React, { useState, useEffect, useRef } from 'react';

const HRShieldIQ = () => {
  const [currentStep, setCurrentStep] = useState('intro');
  const [currentCategory, setCurrentCategory] = useState(0);
  const [answers, setAnswers] = useState({});
  const [businessInfo, setBusinessInfo] = useState({ name: '', industry: '', size: '', email: '' });
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('onetime');
  const [promoCode, setPromoCode] = useState('');
  const [promoError, setPromoError] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [discountedPrice, setDiscountedPrice] = useState(29.99);
  const [activeTab, setActiveTab] = useState('business');
  const [reportSaved, setReportSaved] = useState(false);
  const paypalRef = useRef(null);
  const [hasStoredReport, setHasStoredReport] = useState(false);
  const [printPrompted, setPrintPrompted] = useState(false);

  // Check for stored report on initial load
  useEffect(() => {
    const storedReport = localStorage.getItem('hrshieldiq_report');
    const storedBusiness = localStorage.getItem('hrshieldiq_business');
    if (storedReport && storedBusiness) {
      try {
        const parsedReport = JSON.parse(storedReport);
        const parsedBusiness = JSON.parse(storedBusiness);
        setReport(parsedReport);
        setBusinessInfo(parsedBusiness);
        setPaymentComplete(true);
        setHasStoredReport(true);
        console.log('Found stored report for:', parsedBusiness.name);
      } catch (e) {
        console.log('Error parsing stored report');
        localStorage.removeItem('hrshieldiq_report');
        localStorage.removeItem('hrshieldiq_business');
      }
    }
    
    // Initialize EmailJS
    if (typeof window.emailjs !== 'undefined') {
      window.emailjs.init('oviQBhcc3fq0dRlnK');
      window.emailjsInitialized = true;
      console.log('EmailJS initialized');
    } else {
      // Load EmailJS script dynamically if not present
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';
      script.onload = () => {
        window.emailjs.init('oviQBhcc3fq0dRlnK');
        window.emailjsInitialized = true;
        console.log('EmailJS loaded and initialized');
      };
      document.head.appendChild(script);
    }
  }, []);

  // Auto-prompt print dialog when report loads (first time only)
  useEffect(() => {
    if (currentStep === 'report' && report && !printPrompted) {
      setPrintPrompted(true);
      setTimeout(() => {
        const shouldPrint = window.confirm(
          '📄 Save your report as PDF?\n\nClick OK to open the print dialog (choose "Save as PDF" as your printer).\n\nClick Cancel to view the report first.'
        );
        if (shouldPrint) {
          const downloadBtn = document.querySelector('[data-download-pdf]');
          if (downloadBtn) downloadBtn.click();
        }
      }, 500);
    }
  }, [currentStep, report, printPrompted]);

  // Save report to localStorage when generated
  useEffect(() => {
    if (report && businessInfo.email && currentStep === 'report') {
      localStorage.setItem('hrshieldiq_report', JSON.stringify(report));
      localStorage.setItem('hrshieldiq_business', JSON.stringify(businessInfo));
      console.log('Report saved to localStorage');
    }
  }, [report, businessInfo, currentStep]);

  // Warn before leaving if report not saved
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (currentStep === 'report' && !reportSaved) {
        e.preventDefault();
        e.returnValue = 'Your report may not be saved. Are you sure you want to leave?';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [currentStep, reportSaved]);

  // HRShieldIQ Brand Colors - Blue theme
  const colors = {
    primary: '#2563EB',
    primaryLight: 'rgba(37, 99, 235, 0.15)',
    primaryBorder: 'rgba(37, 99, 235, 0.4)',
    black: '#1a1a1a',
    darkBg: '#0d0d0d',
    darkCard: '#161616',
    darkCardHover: '#1f1f1f',
    white: '#ffffff',
    gray: '#a3a3a3',
    grayLight: '#d4d4d4',
    grayDark: '#525252'
  };

  // Sanitize user input to prevent XSS
  const escapeHtml = (str) => {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  // Scroll to top whenever step or category changes
  useEffect(() => {
    window.scrollTo(0, 0);
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
  }, [currentStep, currentCategory]);

  const [paypalLoading, setPaypalLoading] = useState(false);
  const [paypalSdkType, setPaypalSdkType] = useState(null);
  const neededSdkType = selectedPlan === 'onetime' ? 'onetime' : 'subscription';

  // Load PayPal SDK and render button when paywall opens
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    if (showPaywall && !paymentComplete && businessInfo.email && businessInfo.email.includes('@')) {
      if (paypalSdkType !== neededSdkType) {
        setPaypalLoading(true);
        const existingScripts = document.querySelectorAll('script[src*="paypal.com/sdk"]');
        existingScripts.forEach(s => s.remove());
        window.paypal = undefined;
        
        const script = document.createElement('script');
        const clientId = 'ATtOAGgoUaBRiQSclDhG6I7ER_KhNPgWGs3WUJYgs1fIUw4htpDW0d8NRCzehPkLxTNNBorisya_-NaK';
        
        if (neededSdkType === 'onetime') {
          script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD`;
        } else {
          script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&vault=true&intent=subscription`;
        }
        
        script.async = true;
        script.onload = () => {
          setPaypalSdkType(neededSdkType);
          setPaypalLoading(false);
          renderPayPalButton();
        };
        script.onerror = () => {
          setPaypalLoading(false);
          console.error('Failed to load PayPal SDK');
        };
        document.body.appendChild(script);
      } else if (window.paypal) {
        renderPayPalButton();
      }
    }
  }, [showPaywall, paymentComplete, businessInfo.email, neededSdkType, paypalSdkType]);

  useEffect(() => {
    if (showPaywall && !paymentComplete && window.paypal && paypalSdkType === neededSdkType && !paypalLoading) {
      renderPayPalButton();
    }
  }, [selectedPlan, discountedPrice]);
  /* eslint-enable react-hooks/exhaustive-deps */

  const renderPayPalButton = () => {
    if (!paypalRef.current || !window.paypal) return;
    paypalRef.current.innerHTML = '';
    
    const subscriptionPlanIds = {
      'quarterly': 'P-8KM41655M19557031NFO7YKY',
      'annual': 'P-3CG228805F156324BNFO737I'
    };
    
    if (selectedPlan === 'onetime') {
      window.paypal.Buttons({
        style: { layout: 'vertical', color: 'gold', shape: 'pill', label: 'paypal', height: 45 },
        createOrder: (data, actions) => {
          return actions.order.create({
            purchase_units: [{
              description: 'HRShieldIQ™ - HR Compliance Assessment Report',
              amount: { value: discountedPrice.toFixed(2) }
            }]
          });
        },
        onApprove: async (data, actions) => {
          const order = await actions.order.capture();
          console.log('Payment successful:', order);
          console.log('Customer email:', businessInfo.email);
          console.log('Business name:', businessInfo.name);
          console.log('Plan:', 'onetime');
          console.log('Transaction ID:', order.id);
          setPaymentComplete(true);
          setShowPaywall(false);
          generateReport();
        },
        onError: (err) => {
          console.error('PayPal error:', err);
          alert('Payment failed. Please try again.');
        }
      }).render(paypalRef.current);
    } else {
      window.paypal.Buttons({
        style: { shape: 'pill', color: 'gold', layout: 'vertical', label: 'subscribe', height: 45 },
        createSubscription: (data, actions) => {
          return actions.subscription.create({ plan_id: subscriptionPlanIds[selectedPlan] });
        },
        onApprove: (data, actions) => {
          console.log('Subscription successful!');
          console.log('Subscription ID:', data.subscriptionID);
          setPaymentComplete(true);
          setShowPaywall(false);
          generateReport();
        },
        onError: (err) => {
          console.error('PayPal subscription error:', err);
          alert('Subscription failed. Please try again.');
        }
      }).render(paypalRef.current);
    }
  };

  // HR-SPECIFIC CATEGORIES AND QUESTIONS
  const categories = [
    {
      id: 'hiring',
      title: 'Hiring & Onboarding',
      icon: '📋',
      questions: [
        { 
          id: 'job_application', 
          text: 'Does your job application avoid questions about age, race, religion, marital status, or disabilities?', 
          helper: 'Pre-employment inquiries about protected characteristics can lead to discrimination claims, even if unintentional.',
          options: ['Yes, reviewed by HR/attorney', 'Think so, but not verified', "Not sure what's on it", 'We use an informal process'] 
        },
        { 
          id: 'i9_completion', 
          text: "Do you complete Form I-9 within 3 business days of each new hire's start date?", 
          helper: 'Form I-9 verifies an employee\'s identity and work eligibility. Federal law requires completion within 3 days. ICE (Immigration and Customs Enforcement) fines range from $252 to $2,507 per form for first offenses.',
          options: ['Yes, always within 3 days', 'Usually, but sometimes delayed', 'Often completed late', 'Not sure what I-9 is'] 
        },
        { 
          id: 'i9_storage', 
          text: 'Where do you store I-9 forms?', 
          helper: 'I-9s must be stored separately from personnel files. During an audit, you must produce I-9s without exposing other employee records.',
          options: ['Separate I-9 folder/binder', "In each employee's personnel file", 'Digital HR system separately', 'Not sure'] 
        },
        { 
          id: 'background_checks', 
          text: 'If you run background checks, do applicants sign a separate disclosure and authorization form?', 
          helper: 'The FCRA (Fair Credit Reporting Act) requires standalone disclosure—not buried in the application—and written consent before running any background check.',
          options: ['Yes, separate FCRA-compliant form', "It's included in our application", "We don't run background checks", 'Not sure'] 
        },
        { 
          id: 'offer_letters', 
          text: 'Do you provide written offer letters that include at-will language?', 
          helper: 'Verbal offers or missing at-will statements can create implied contracts, making termination more legally complex.',
          options: ['Yes, with at-will language', 'Yes, but no at-will statement', 'Verbal offers only', 'Varies by position'] 
        }
      ]
    },
    {
      id: 'handbook',
      title: 'Policies & Handbook',
      icon: '📖',
      questions: [
        { 
          id: 'handbook_exists', 
          text: 'Do you have a written employee handbook?', 
          helper: 'A handbook establishes clear expectations and provides legal protection when policies are consistently applied.',
          options: ['Yes, comprehensive and current', 'Yes, but outdated', 'Informal policies only', 'No handbook'] 
        },
        { 
          id: 'handbook_updated', 
          text: 'When was your employee handbook last reviewed or updated?', 
          helper: 'Employment law changes frequently. COVID policies, state leave laws, and harassment definitions have changed significantly since 2020.',
          options: ['Within the last year', '1-2 years ago', '3+ years ago', 'Not sure / Never'] 
        },
        { 
          id: 'harassment_policy', 
          text: 'Does your handbook include an anti-harassment policy with multiple reporting channels?', 
          helper: 'Employees must have options beyond just reporting to their direct supervisor. Single-channel policies fail if the harasser is the supervisor.',
          options: ['Yes, multiple reporting options', 'Yes, but supervisor-only reporting', 'General policy, unclear process', 'No harassment policy'] 
        },
        { 
          id: 'handbook_acknowledgment', 
          text: 'Do employees sign an acknowledgment that they received and read the handbook?', 
          helper: 'Signed acknowledgments prove employees were informed of policies. Without them, employees can claim ignorance.',
          options: ['Yes, signed and filed', 'Yes, but not always collected', 'No formal acknowledgment', 'Not applicable'] 
        },
        { 
          id: 'at_will_statement', 
          text: 'Does your handbook clearly state employment is at-will (if applicable in your state)?', 
          helper: 'At-will language should appear prominently and not be contradicted by other handbook language about job security.',
          options: ['Yes, clearly stated', 'Mentioned but not prominent', 'No at-will statement', "Not sure / State doesn't allow"] 
        }
      ]
    },
    {
      id: 'wage',
      title: 'Wage & Hour',
      icon: '💰',
      questions: [
        { 
          id: 'classification', 
          text: 'How do you determine if employees are exempt (salaried, no overtime) or non-exempt (hourly, overtime eligible)?', 
          helper: 'Misclassification is the #1 wage & hour violation. Job duties—not title or salary alone—determine exempt status under the FLSA (Fair Labor Standards Act).',
          options: ['Formal review of duties against FLSA tests', 'Based on job title and salary level', 'Everyone is hourly/non-exempt', 'Not sure of the difference'] 
        },
        { 
          id: 'time_tracking', 
          text: 'How do non-exempt employees record their work time?', 
          helper: 'Employers must keep accurate time records. "Honor system" or manager estimates create liability if employees claim unpaid hours.',
          options: ['Time clock or digital system', 'Paper timesheets signed by employee', 'Manager tracks/estimates hours', 'No formal tracking'] 
        },
        { 
          id: 'overtime_pay', 
          text: 'Are non-exempt employees paid 1.5x their regular rate for hours over 40 per week?', 
          helper: 'Federal law requires overtime at 1.5x. Some states have daily overtime or other rules. Comp time instead of pay is illegal for private employers.',
          options: ['Yes, always calculated correctly', 'Yes, but calculation may vary', 'We offer comp time instead', "Not sure how it's handled"] 
        },
        { 
          id: 'meal_breaks', 
          text: 'Do you have clear policies about meal and rest breaks?', 
          helper: 'Many states require paid rest breaks and unpaid meal periods. Employees working through lunch without pay is a common violation.',
          options: ['Yes, compliant with state law', 'Informal break expectations', 'Employees take breaks as needed', 'Not sure of state requirements'] 
        },
        { 
          id: 'final_paycheck', 
          text: 'When an employee leaves, when do they receive their final paycheck?', 
          helper: 'State laws vary dramatically—some require immediate payment upon termination, others allow until next regular payday. Violations incur penalties.',
          options: ['We follow state-specific timing', 'Next regular payday', 'Within 2 weeks', 'Not sure of requirements'] 
        }
      ]
    },
    {
      id: 'compliance',
      title: 'Documentation & Compliance',
      icon: '📁',
      questions: [
        { 
          id: 'personnel_files', 
          text: 'Do you maintain organized personnel files for each employee?', 
          helper: 'Personnel files should contain job applications, performance reviews, disciplinary actions, and signed policy acknowledgments.',
          options: ['Yes, complete and organized', 'Partial records for most employees', 'Scattered or inconsistent', 'No formal personnel files'] 
        },
        { 
          id: 'performance_documentation', 
          text: 'How do you document employee performance issues?', 
          helper: 'Written documentation of performance problems protects you if termination is challenged. Verbal warnings alone are difficult to prove.',
          options: ['Written warnings, signed by employee', 'Manager notes in file', 'Verbal conversations only', 'No documentation process'] 
        },
        { 
          id: 'harassment_training', 
          text: 'Do employees receive harassment prevention training?', 
          helper: 'Several states require harassment training. Even where not required, training demonstrates good faith effort to prevent harassment.',
          options: ['Yes, annual training for all', 'Yes, during onboarding only', 'Managers only', 'No formal training'] 
        },
        { 
          id: 'poster_compliance', 
          text: 'Are required federal and state employment posters displayed in your workplace?', 
          helper: 'Required posters cover minimum wage, FMLA (Family Medical Leave Act), OSHA (workplace safety), EEO (Equal Employment Opportunity), and state-specific rules. Fines range from $100-$35,000.',
          options: ['Yes, current year posters displayed', 'Yes, but may be outdated', 'Some posters, not all', 'No posters / Not sure'] 
        },
        { 
          id: 'eeoc_records', 
          text: 'Do you retain employment records (applications, personnel files) for required periods?', 
          helper: 'The EEOC (Equal Employment Opportunity Commission) requires 1 year for applications, 1 year after termination for personnel records. The FLSA requires 3 years for payroll. Longer is safer.',
          options: ['Yes, we follow retention schedules', 'We keep everything indefinitely', 'Varies, no formal policy', 'Not sure of requirements'] 
        }
      ]
    },
    {
      id: 'termination',
      title: 'Termination & Safety',
      icon: '🚪',
      questions: [
        { 
          id: 'termination_process', 
          text: 'Do you have a documented termination checklist or process?', 
          helper: 'Consistent termination procedures ensure legal compliance, proper final pay, benefits info, and return of company property.',
          options: ['Yes, formal documented process', 'Informal but consistent approach', 'Handled case-by-case', 'No process'] 
        },
        { 
          id: 'exit_interviews', 
          text: 'Do you conduct exit interviews with departing employees?', 
          helper: "Exit interviews can reveal workplace issues, potential claims, and provide documentation of the employee's voluntary departure.",
          options: ['Yes, standard practice', 'Sometimes, inconsistently', 'Rarely or never', 'Only for certain positions'] 
        },
        { 
          id: 'cobra_notice', 
          text: 'When employees leave, do you provide required COBRA or state continuation notices?', 
          helper: 'COBRA (health insurance continuation) lets departing employees keep their coverage temporarily. Employers with 20+ employees must offer it within 14 days of termination. Many states have mini-COBRA for smaller employers.',
          options: ['Yes, timely notices sent', 'Our insurance carrier handles it', 'We have fewer than 20 employees', 'Not sure if we comply'] 
        },
        { 
          id: 'workers_comp', 
          text: "Do you have workers' compensation insurance and a process for reporting injuries?", 
          helper: "Workers' comp is required in almost all states. Failure to carry coverage can result in criminal penalties and personal liability.",
          options: ['Yes, insurance and reporting process', 'Yes, but informal reporting', 'Not sure about our coverage', "We're exempt (certain states)"] 
        },
        { 
          id: 'retaliation_awareness', 
          text: 'Do managers understand what constitutes illegal retaliation against employees?', 
          helper: 'Retaliation claims are the #1 charge filed with the EEOC (Equal Employment Opportunity Commission). Adverse actions after complaints—even legitimate discipline—can appear retaliatory.',
          options: ['Yes, managers are trained', 'Generally understood', 'Not specifically addressed', 'Not sure'] 
        }
      ]
    }
  ];

  const handleAnswer = (questionId, answer) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const calculateRiskScore = () => {
    let highRisk = 0;
    let mediumRisk = 0;
    let iqScore = 0;
    
    Object.entries(answers).forEach(([key, value]) => {
      if (value.includes('No ') || value.includes('Never') || value === 'Not sure' || value.includes('Not sure what') || value.includes('No formal') || value.includes('No policy') || value.includes('No handbook') || value.includes('No process') || value.includes('No posters') || value.includes('No documentation') || value.includes('Verbal') || value.includes('case-by-case')) {
        highRisk++;
        iqScore += 0;
      } else if (value.includes('Partially') || value.includes('Informal') || value.includes('Occasionally') || value.includes('some') || value.includes('Eventually') || value.includes('Rarely') || value.includes('Think so') || value.includes('Usually') || value.includes('Sometimes') || value.includes('Varies') || value.includes('outdated') || value.includes('but not')) {
        mediumRisk++;
        iqScore += 12;
      } else {
        iqScore += 20;
      }
    });
    
    return { 
      highRisk, 
      mediumRisk, 
      lowRisk: Object.keys(answers).length - highRisk - mediumRisk,
      iqScore: iqScore
    };
  };

  // Send report email function
  const sendReportEmail = async (emailAddress, reportData) => {
    console.log('sendReportEmail called with:', emailAddress);
    if (!emailAddress || !emailAddress.includes('@')) {
      console.log('No valid email provided for report delivery');
      return;
    }
    try {
      // Wait for EmailJS to be available (with timeout)
      let attempts = 0;
      while (typeof window.emailjs === 'undefined' && attempts < 10) {
        await new Promise(resolve => setTimeout(resolve, 500));
        attempts++;
      }
      
      if (typeof window.emailjs === 'undefined') {
        console.log('EmailJS not loaded after waiting - skipping email send');
        return;
      }
      
      // Ensure EmailJS is initialized
      if (!window.emailjsInitialized) {
        window.emailjs.init('oviQBhcc3fq0dRlnK');
        window.emailjsInitialized = true;
      }
      
      console.log('EmailJS is loaded, preparing to send...');
      const r = reportData || {};
      const { iqScore } = calculateRiskScore();
      
      let prioritiesText = '';
      if (r.priorities && r.priorities.length > 0) {
        prioritiesText = r.priorities.map((p, i) => 
          `${i + 1}. ${p.title || 'Priority'}\n   → ${p.reason || ''}`
        ).join('\n\n');
      }
      
      let criticalText = '';
      if (r.criticalIssues && r.criticalIssues.length > 0) {
        criticalText = r.criticalIssues.map(issue => 
          `⚠️ ${issue.topic || 'Issue'}\n   Risk: ${issue.risk || 'See recommendation'}\n   Fix: ${issue.fix || 'Address this issue'}\n   Effort: ${issue.effort || 'Varies'}`
        ).join('\n\n');
      }
      
      let attentionText = '';
      if (r.attentionIssues && r.attentionIssues.length > 0) {
        attentionText = r.attentionIssues.map(issue => 
          `• ${issue.topic || 'Issue'}\n   Fix: ${issue.fix || 'Address this'}\n   Effort: ${issue.effort || 'Varies'}`
        ).join('\n\n');
      }
      
      let goodText = '';
      if (r.goodPractices && r.goodPractices.length > 0) {
        goodText = r.goodPractices.map(practice => `✓ ${practice}`).join('\n');
      }
      
      let actionText = '';
      if (r.actionPlan) {
        const week1 = r.actionPlan.week1 ? r.actionPlan.week1.join('\n   • ') : '';
        const week2 = r.actionPlan.week2to4 ? r.actionPlan.week2to4.join('\n   • ') : '';
        const ongoing = r.actionPlan.ongoing ? r.actionPlan.ongoing.join('\n   • ') : '';
        actionText = `WEEK 1 (Quick Wins):\n   • ${week1}\n\nWEEK 2-4:\n   • ${week2}\n\nONGOING:\n   • ${ongoing}`;
      }
      
      const fullReport = `
═══════════════════════════════════════
       YOUR HRSHIELDIQ™ REPORT
═══════════════════════════════════════

Organization: ${businessInfo.name || 'Your Organization'}
Industry: ${businessInfo.industry || 'N/A'}
Size: ${businessInfo.size || 'N/A'}

HRShieldIQ™ SCORE: ${r.score || iqScore}/500
RISK LEVEL: ${r.riskLevel || 'See below'}

───────────────────────────────────────
EXECUTIVE SUMMARY
───────────────────────────────────────
${r.executiveSummary || 'Assessment completed. See details below.'}

───────────────────────────────────────
TOP PRIORITIES
───────────────────────────────────────
${prioritiesText || 'Review findings below'}

───────────────────────────────────────
CRITICAL ISSUES (${r.criticalCount || 0})
───────────────────────────────────────
${criticalText || 'None identified'}

───────────────────────────────────────
NEEDS ATTENTION (${r.attentionCount || 0})
───────────────────────────────────────
${attentionText || 'None identified'}

───────────────────────────────────────
GOOD PRACTICES (${r.goodCount || 0})
───────────────────────────────────────
${goodText || 'See report'}

───────────────────────────────────────
30-DAY ACTION PLAN
───────────────────────────────────────
${actionText || 'Review report for recommendations'}

═══════════════════════════════════════
       RESOURCES
═══════════════════════════════════════
• DOL (Dept. of Labor) Wage & Hour: dol.gov/agencies/whd
• EEOC (Equal Employment Opportunity): eeoc.gov/employers
• SHRM (HR Association): shrm.org
• I-9 Central (Work Eligibility): uscis.gov/i-9

───────────────────────────────────────
This report was generated by HRShieldIQ™
For questions: info@techshieldkc.com
© ${new Date().getFullYear()} TechShield KC LLC
───────────────────────────────────────
`;

      const templateParams = {
        to_email: emailAddress,
        to_name: businessInfo.name || 'Customer',
        from_name: 'HRShieldIQ',
        subject: `Your HRShieldIQ Report - ${businessInfo.name || 'Assessment Complete'}`,
        message: fullReport
      };

      console.log('Sending email to:', emailAddress);
      const result = await window.emailjs.send('service_9hdzso6', 'template_e7m1f2h', templateParams);
      console.log('Email sent successfully:', result);
    } catch (error) {
      console.error('Failed to send report email:', error);
    }
  };

  // Background report generation
  const [reportGenerating, setReportGenerating] = useState(false);
  const [reportReady, setReportReady] = useState(false);
  const [pendingReport, setPendingReport] = useState(null);
  
  // Ref to store the generation promise so multiple callers can await it
  const generationPromiseRef = useRef(null);

  const startBackgroundReportGeneration = async () => {
    // If already ready, return the cached report
    if (reportReady && pendingReport) return pendingReport;
    
    // If already generating, return the existing promise
    if (generationPromiseRef.current) {
      console.log('Generation already in progress, returning existing promise');
      return generationPromiseRef.current;
    }
    
    console.log('Starting background report generation...');
    setReportGenerating(true);
    
    // Create the generation promise
    const doGeneration = async () => {
      try {
        const { iqScore } = calculateRiskScore();
        const prompt = `You are an HR compliance advisor. Analyze this assessment and return ONLY valid JSON. BE CONCISE - no fluff, just actionable info.

BUSINESS: ${businessInfo.name}
INDUSTRY: ${businessInfo.industry}
SIZE: ${businessInfo.size}

ANSWERS (ALL 25 MUST BE CATEGORIZED):
${Object.entries(answers).map(([q, a]) => `${q}: ${a}`).join('\n')}

SCORING:
- 25 questions × 20 points = 500 max
- First option = 20 pts, Second = 12 pts, Third = 4 pts, Fourth = 0 pts
- Under 200=HIGH RISK, 200-300=ELEVATED, 300-400=MODERATE, 400-500=STRONG

CATEGORIZE EVERY ANSWER:
- criticalIssues: 0-4 point answers (worst two options)
- attentionIssues: 12 point answers (second-best)
- goodPractices: 20 point answers (best)

INDUSTRY CONTEXT for ${businessInfo.industry}:
- Healthcare: HIPAA (patient privacy), credential checks, on-call pay
- Religious: Ministerial exception, volunteer classification
- Daycare: Background checks, abuse reporting, staff ratios
- Retail/Restaurant: Tip credit, minor permits, predictive scheduling
- Construction: Davis-Bacon Act (federal wages), prevailing wage
- Professional Services: Exempt classification, non-competes
- Manufacturing: OSHA (safety) records, union rules
- Nonprofit: Volunteer vs employee, grant compliance

WRITING RULES:
- Define acronyms on first use: "FMLA (Family Medical Leave Act)"
- Keep descriptions SHORT - 1-2 sentences max per item
- Focus on WHAT to fix and WHY it matters
- Include specific penalties/fines where relevant

Return this JSON:
{
  "score": [0-500],
  "riskLevel": "[HIGH RISK/ELEVATED/MODERATE/STRONG]",
  "criticalCount": [count],
  "attentionCount": [count],
  "goodCount": [count - must total 25],
  "executiveSummary": "[2-3 sentences max, industry-specific]",
  "priorities": [{"title": "[action]", "reason": "[1 sentence why + penalty]"}, ...3 items],
  "criticalIssues": [{"topic": "[area]", "answer": "[their answer]", "risk": "[1 sentence consequence]", "fix": "[1 sentence solution]", "effort": "[time estimate]"}],
  "attentionIssues": [{"topic": "[area]", "answer": "[answer]", "risk": "[1 sentence]", "fix": "[1 sentence]", "effort": "[time]"}],
  "goodPractices": ["[short phrase - what they're doing well]"],
  "actionPlan": {"week1": ["[brief task]"], "week2to4": ["[brief task]"], "ongoing": ["[brief task]"]}
}

CRITICAL: Return ONLY valid JSON, no markdown.`;

        const response = await fetch('/api/generate-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt })
        });
        
        const data = await response.json();
        
        if (!response.ok) throw new Error(data.error || 'Failed to generate report');
        
        let reportData;
        try {
          const reportText = data.report || '';
          const cleanJson = reportText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          reportData = JSON.parse(cleanJson);
        } catch (parseError) {
          console.error('JSON parse error:', parseError);
          reportData = {
            score: iqScore,
            riskLevel: iqScore < 200 ? 'HIGH RISK' : iqScore < 300 ? 'ELEVATED RISK' : iqScore < 400 ? 'MODERATE' : 'STRONG',
            criticalCount: 3,
            attentionCount: 5,
            goodCount: 17,
            executiveSummary: 'Assessment completed. Review details below for specific recommendations.',
            priorities: [
              { title: 'Review I-9 compliance', reason: 'ICE fines range from $252-$2,507 per form' },
              { title: 'Update employee handbook', reason: 'Outdated policies create liability exposure' },
              { title: 'Document performance issues', reason: 'Verbal-only warnings are difficult to defend' }
            ],
            criticalIssues: [],
            attentionIssues: [],
            goodPractices: ['Assessment completed'],
            actionPlan: { week1: ['Review findings'], week2to4: ['Implement fixes'], ongoing: ['Monitor compliance'] }
          };
        }
        
        console.log('Background report ready!');
        setPendingReport(reportData);
        setReportReady(true);
        return reportData;
        
      } catch (error) {
        console.error('Background report error:', error);
        const { iqScore } = calculateRiskScore();
        const fallbackReport = {
          score: iqScore,
          riskLevel: iqScore < 200 ? 'HIGH RISK' : iqScore < 300 ? 'ELEVATED RISK' : iqScore < 400 ? 'MODERATE' : 'STRONG',
          criticalCount: 3,
          attentionCount: 5,
          goodCount: 17,
          executiveSummary: 'Assessment completed.',
          priorities: [
            { title: 'Review I-9 compliance', reason: 'ICE fines are significant' },
            { title: 'Update handbook', reason: 'Employment law changes frequently' },
            { title: 'Document performance', reason: 'Protects against wrongful termination claims' }
          ],
          criticalIssues: [],
          attentionIssues: [],
          goodPractices: [],
          actionPlan: { week1: ['Review report'], week2to4: ['Implement changes'], ongoing: ['Annual review'] }
        };
        setPendingReport(fallbackReport);
        setReportReady(true);
        return fallbackReport;
      } finally {
        setReportGenerating(false);
        generationPromiseRef.current = null;
      }
    };
    
    // Store the promise and return it
    generationPromiseRef.current = doGeneration();
    return generationPromiseRef.current;
  };

  const generateReport = async () => {
    // If report is already ready, use it immediately
    if (reportReady && pendingReport) {
      console.log('Using pre-generated report');
      setReport(pendingReport);
      setCurrentStep('report');
      setLoading(false);
      if (businessInfo.email) {
        sendReportEmail(businessInfo.email, pendingReport);
      }
      return;
    }
    
    setLoading(true);
    
    let generatedReport;
    
    // If generation is in progress, wait for the existing promise
    if (generationPromiseRef.current) {
      console.log('Waiting for in-progress report generation...');
      generatedReport = await generationPromiseRef.current;
    } else {
      // Start fresh generation
      generatedReport = await startBackgroundReportGeneration();
    }
    
    // Use the returned report data
    if (generatedReport) {
      console.log('Report generated, transitioning to report screen');
      setReport(generatedReport);
      setCurrentStep('report');
      setLoading(false);
      if (businessInfo.email) {
        sendReportEmail(businessInfo.email, generatedReport);
      }
    } else {
      console.error('Failed to generate report');
      setLoading(false);
    }
  };

  /* eslint-disable react-hooks/exhaustive-deps */
  // Start background generation when all questions answered
  useEffect(() => {
    if (Object.keys(answers).length === 25 && !reportGenerating && !reportReady) {
      console.log('All questions answered, starting background report...');
      startBackgroundReportGeneration();
    }
  }, [answers]);

  // Auto-start background report when entering preview
  useEffect(() => {
    if (currentStep === 'preview' && !reportGenerating && !reportReady && Object.keys(answers).length === 25) {
      startBackgroundReportGeneration();
    }
  }, [currentStep]);

  useEffect(() => {
    if (currentCategory === categories.length - 1) {
      const allAnswered = categories[currentCategory].questions.every(q => answers[q.id]);
      if (allAnswered && !reportGenerating && !reportReady) {
        startBackgroundReportGeneration();
      }
    }
  }, [currentCategory, answers]);

  useEffect(() => {
    if (loading && reportReady && pendingReport) {
      console.log('Background report ready, showing to user...');
      setReport(pendingReport);
      setCurrentStep('report');
      setLoading(false);
      if (businessInfo.email) {
        sendReportEmail(businessInfo.email, pendingReport);
      }
    }
  }, [loading, reportReady, pendingReport]);
  /* eslint-enable react-hooks/exhaustive-deps */

  const currentCategoryData = categories[currentCategory];
  const allQuestionsAnswered = currentCategoryData?.questions.every(q => answers[q.id]);
  const totalQuestions = categories.reduce((sum, cat) => sum + cat.questions.length, 0);
  const answeredQuestions = Object.keys(answers).length;

  const baseStyles = {
    minHeight: '100vh',
    background: `linear-gradient(135deg, ${colors.darkBg} 0%, ${colors.black} 100%)`,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    color: colors.white,
    padding: 'clamp(1rem, 4vw, 2rem)',
    overflowX: 'hidden'
  };

  const globalStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { overflow-x: hidden; }
    html { font-size: 16px; }
    body { -webkit-text-size-adjust: 100%; }
    input, select, button { font-family: inherit; font-size: 16px; }
    input, select { min-height: 48px; }
    input[type="email"], input[type="text"] { -webkit-appearance: none; appearance: none; }
    button { min-height: 48px; touch-action: manipulation; -webkit-tap-highlight-color: transparent; }
    ::selection { background: ${colors.primary}; color: white; }
    @media (max-width: 480px) { 
      html { font-size: 15px; }
      input, select, button { font-size: 16px !important; }
    }
    @media (max-width: 360px) {
      html { font-size: 14px; }
    }
  `;

  // INTRO SCREEN - Landing Page
  if (currentStep === 'intro') {
    const audiences = {
      business: { label: 'Small Business', stat: 'Employment lawsuits have increased 400%', subtext: 'over the past 20 years' },
      healthcare: { label: 'Healthcare', stat: '19.5% employee turnover rate', subtext: 'with strict credentialing & training required' },
      nonprofit: { label: 'Nonprofits', stat: '30% face labor violations annually', subtext: 'often from volunteer vs. employee confusion' },
      restaurant: { label: 'Restaurant', stat: 'Wage & hour claims average $40,000', subtext: 'from tip credit and overtime miscalculations' }
    };

    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', color: '#e5e5e5', fontFamily: "'Inter', system-ui, sans-serif", lineHeight: 1.6 }}>
        <style>{globalStyles}</style>
        <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse at 50% 0%, rgba(37,99,235,0.08) 0%, transparent 60%)', pointerEvents: 'none', zIndex: 0 }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          
          {/* Saved Report Banner */}
          {hasStoredReport && report && (
            <div style={{ background: 'linear-gradient(135deg, #1a472a 0%, #0f2818 100%)', borderBottom: '2px solid #22c55e', padding: '16px 24px', textAlign: 'center' }}>
              <p style={{ color: '#fff', fontSize: '1rem', marginBottom: '12px' }}>
                📄 You have a saved report for <strong>{businessInfo.name}</strong>
              </p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button onClick={() => setCurrentStep('report')} style={{ background: '#22c55e', border: 'none', borderRadius: '6px', padding: '10px 20px', color: '#000', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.9rem', fontWeight: 600 }}>
                  View My Report
                </button>
                <button onClick={() => { localStorage.removeItem('hrshieldiq_report'); localStorage.removeItem('hrshieldiq_business'); setHasStoredReport(false); setReport(null); setBusinessInfo({ name: '', industry: '', size: '', email: '' }); setPaymentComplete(false); }} style={{ background: 'transparent', border: '1px solid #666', borderRadius: '6px', padding: '10px 20px', color: '#999', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.9rem' }}>
                  Start Fresh
                </button>
              </div>
            </div>
          )}

          {/* Hero */}
          <section style={{ padding: '60px 24px 48px', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
            <h1 style={{ fontSize: 'clamp(2.5rem, 12vw, 3.5rem)', fontWeight: 700, marginBottom: '16px', letterSpacing: '-0.02em' }}>
              <span style={{ color: '#fff' }}>HRShield</span>
              <span style={{ color: colors.primary }}>IQ</span>
              <span style={{ color: colors.primary, fontSize: '0.5em', verticalAlign: 'super' }}>™</span>
            </h1>

            <p style={{ fontSize: '1.25rem', color: '#999', marginBottom: '8px' }}>
              Before you spend $10,000 on an HR audit,
            </p>
            <p style={{ fontSize: '1.25rem', color: '#fff', marginBottom: '28px' }}>
              spend <span style={{ color: colors.primary, fontWeight: 600 }}>under 10 minutes</span> finding out what you actually need.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '16px', marginBottom: '8px', fontSize: '1.05rem', color: '#666' }}>
              <span>✓ ~10 min</span>
              <span>✓ 25 questions</span>
              <span>✓ DOL & EEOC</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#444', marginBottom: '28px' }}>
              (Department of Labor & Equal Employment Opportunity Commission)
            </p>

            {/* Tabs */}
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px', marginBottom: '20px' }}>
              {Object.entries(audiences).map(([key, val]) => (
                <button key={key} onClick={() => setActiveTab(key)} style={{ padding: '10px 16px', fontSize: '0.95rem', fontWeight: 500, backgroundColor: activeTab === key ? colors.primary : 'transparent', color: activeTab === key ? '#fff' : '#666', border: activeTab === key ? 'none' : '1px solid #333', borderRadius: '20px', cursor: 'pointer', fontFamily: 'inherit' }}>
                  {val.label}
                </button>
              ))}
            </div>

            {/* Stat box */}
            <div style={{ backgroundColor: 'rgba(37,99,235,0.08)', borderLeft: `4px solid ${colors.primary}`, borderRadius: '8px', padding: '20px 24px', textAlign: 'center', marginBottom: '32px' }}>
              <p style={{ fontSize: '1.15rem', margin: 0, lineHeight: 1.6 }}>
                <span style={{ color: colors.primary, fontWeight: 600 }}>{audiences[activeTab].stat}</span>
                <span style={{ color: '#888' }}>, {audiences[activeTab].subtext}.</span>
              </p>
            </div>

            <button onClick={() => setCurrentStep('business')} style={{ display: 'inline-block', backgroundColor: colors.primary, color: '#fff', padding: '18px 40px', fontSize: '1.15rem', fontWeight: 600, borderRadius: '8px', border: 'none', cursor: 'pointer', boxShadow: '0 4px 24px rgba(37,99,235,0.35)', fontFamily: 'inherit' }}>
              Start Free Assessment →
            </button>
            <p style={{ fontSize: '1rem', color: '#555', marginTop: '16px' }}>
              Free preview • Full report: <span style={{ color: colors.primary, fontWeight: 600 }}>$29.99</span> • ~10 min
            </p>
          </section>

          {/* Problem */}
          <section style={{ padding: '48px 24px', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#fff', marginBottom: '24px' }}>The problem with "experts"</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' }}>
              {['💰 HR consultants charge $150-300/hour', '⚖️ Attorneys bill for questions you could answer', "📋 You don't know what you don't know"].map((item, i) => (
                <div key={i} style={{ backgroundColor: '#141414', borderRadius: '8px', padding: '16px 20px', fontSize: '1.1rem', color: '#999', border: '1px solid #1a1a1a', textAlign: 'center' }}>{item}</div>
              ))}
            </div>
            <p style={{ fontSize: '1.2rem', color: '#fff' }}>What if you knew <span style={{ color: colors.primary }}>where you stand</span> first?</p>
          </section>

          {/* Credibility */}
          <section style={{ padding: '48px 24px', backgroundColor: '#0f0f0f' }}>
            <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#fff', marginBottom: '24px' }}>Built on real standards</h2>
              <div style={{ backgroundColor: '#141414', borderRadius: '12px', padding: '24px', border: '1px solid #252525', marginBottom: '16px' }}>
                <p style={{ fontSize: '1.05rem', color: '#ccc', lineHeight: 1.7, margin: 0 }}>
                  Built on <span style={{ color: colors.primary, fontWeight: 600 }}>DOL</span> (Dept. of Labor) guidelines, <span style={{ color: colors.primary, fontWeight: 600 }}>EEOC</span> (Equal Employment Opportunity) requirements, and <span style={{ color: colors.primary, fontWeight: 600 }}>SHRM</span> (Society for Human Resource Management) best practices.
                </p>
              </div>
              <div style={{ backgroundColor: '#141414', borderRadius: '12px', padding: '24px', border: '1px solid #252525' }}>
                <p style={{ fontSize: '1.05rem', color: '#ccc', lineHeight: 1.7, margin: 0 }}>
                  Built by a <span style={{ color: '#fff', fontWeight: 500 }}>20-year IT veteran</span> who managed operations across 150+ locations. Developed with input from a <span style={{ color: '#fff', fontWeight: 500 }}>healthcare HR VP</span> who's lived this stuff.
                </p>
              </div>
            </div>
          </section>

          {/* Features */}
          <section style={{ padding: '48px 24px' }}>
            <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#fff', marginBottom: '28px' }}>Your report includes</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                {[
                  { icon: '🎯', title: 'Find Gaps', items: 'Hiring, handbook, wage & hour, docs' },
                  { icon: '📊', title: 'Understand Risk', items: 'Plain English, penalty amounts' },
                  { icon: '✅', title: 'Action Plan', items: '30-day roadmap, time estimates' },
                  { icon: '🔗', title: 'Resources', items: 'DOL, EEOC, SHRM guides' }
                ].map((card, i) => (
                  <div key={i} style={{ backgroundColor: '#1a1a1a', borderRadius: '10px', padding: '20px', border: '1px solid #252525', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.75rem', marginBottom: '10px' }}>{card.icon}</div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff', marginBottom: '8px' }}>{card.title}</h3>
                    <p style={{ fontSize: '0.95rem', color: '#666', margin: 0, lineHeight: 1.5 }}>{card.items}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Sample Report */}
          <section style={{ padding: '48px 24px', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#fff', marginBottom: '24px' }}>Sample report preview</h2>
            <div style={{ backgroundColor: '#141414', borderRadius: '12px', padding: '24px', border: '1px solid #252525' }}>
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '2.5rem', fontWeight: 700, color: colors.primary }}>324<span style={{ fontSize: '1rem', color: '#666' }}>/500</span></div>
                <span style={{ backgroundColor: 'rgba(37,99,235,0.2)', color: colors.primary, padding: '4px 12px', borderRadius: '4px', fontSize: '0.9rem', fontWeight: 600 }}>MODERATE RISK</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginBottom: '20px', fontSize: '1rem' }}>
                <div style={{ textAlign: 'center' }}><div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#e74c3c' }}>3</div><div style={{ color: '#666', fontSize: '0.85rem' }}>Critical</div></div>
                <div style={{ textAlign: 'center' }}><div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f39c12' }}>5</div><div style={{ color: '#666', fontSize: '0.85rem' }}>Attention</div></div>
                <div style={{ textAlign: 'center' }}><div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#27ae60' }}>17</div><div style={{ color: '#666', fontSize: '0.85rem' }}>Good</div></div>
              </div>
              <div style={{ backgroundColor: '#1a1a1a', borderRadius: '8px', padding: '16px', marginBottom: '16px', textAlign: 'left' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ color: '#e74c3c', fontWeight: 600, fontSize: '1rem' }}>🔴 I-9s Stored in Personnel Files</span>
                  <span style={{ backgroundColor: '#e74c3c', color: '#fff', padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>CRITICAL</span>
                </div>
                <p style={{ color: '#888', fontSize: '0.95rem', margin: 0 }}>Fix: Create separate I-9 folder. <span style={{ color: colors.primary }}>⏱️ 1-2 hours</span></p>
              </div>
              <div style={{ backgroundColor: '#1a1a1a', borderRadius: '8px', padding: '16px', textAlign: 'center' }}>
                <p style={{ color: '#fff', fontWeight: 600, fontSize: '1rem', margin: '0 0 12px' }}>🎯 30-Day Action Plan</p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  {['Separate I-9s', 'Update handbook', 'Review classifications'].map((item, i) => (
                    <span key={i} style={{ backgroundColor: '#252525', color: '#888', padding: '6px 12px', borderRadius: '6px', fontSize: '0.9rem' }}>{item}</span>
                  ))}
                  <span style={{ color: colors.primary, fontSize: '0.9rem', padding: '6px' }}>+12 more</span>
                </div>
              </div>
            </div>
            <a href="/sample-report.html" target="_blank" style={{ display: 'inline-block', color: colors.primary, marginTop: '20px', fontSize: '1rem', textDecoration: 'none' }}>View full sample →</a>
          </section>

          {/* Price Comparison */}
          <section style={{ padding: '48px 24px', backgroundColor: '#0f0f0f' }}>
            <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#fff', marginBottom: '28px' }}>The math</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                <div style={{ backgroundColor: '#1a1a1a', borderRadius: '10px', padding: '20px 12px', border: '1px solid #252525' }}>
                  <p style={{ color: '#555', fontSize: '0.9rem', margin: '0 0 8px' }}>HR Audit</p>
                  <p style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 700, margin: '0 0 8px' }}>$10,000+</p>
                  <p style={{ color: '#444', fontSize: '0.85rem', margin: 0 }}>4-8 weeks</p>
                </div>
                <div style={{ backgroundColor: '#1a1a1a', borderRadius: '10px', padding: '20px 12px', border: '1px solid #252525' }}>
                  <p style={{ color: '#555', fontSize: '0.9rem', margin: '0 0 8px' }}>Ignore it</p>
                  <p style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 700, margin: '0 0 8px' }}>$0</p>
                  <p style={{ color: '#444', fontSize: '0.85rem', margin: 0 }}>Until lawsuit</p>
                </div>
                <div style={{ backgroundColor: 'rgba(37,99,235,0.1)', borderRadius: '10px', padding: '20px 12px', border: `2px solid ${colors.primary}`, position: 'relative' }}>
                  <div style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', backgroundColor: colors.primary, color: '#fff', padding: '3px 10px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600 }}>SMART</div>
                  <p style={{ color: colors.primary, fontSize: '0.9rem', margin: '0 0 8px' }}>HRShieldIQ</p>
                  <p style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 700, margin: '0 0 8px' }}>$29.99</p>
                  <p style={{ color: '#888', fontSize: '0.85rem', margin: 0 }}>under 10 minutes</p>
                </div>
              </div>
            </div>
          </section>

          {/* What It Is */}
          <section style={{ padding: '48px 24px', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#fff', marginBottom: '24px' }}>What this is</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', fontSize: '1rem' }}>
              <div>
                <p style={{ color: '#27ae60', fontWeight: 600, marginBottom: '12px', fontSize: '1.1rem' }}>✓ IS</p>
                {['Clarity before spending', 'Prioritized roadmap', 'Smart first step'].map((item, i) => (
                  <p key={i} style={{ color: '#888', margin: '8px 0' }}>{item}</p>
                ))}
              </div>
              <div>
                <p style={{ color: '#e74c3c', fontWeight: 600, marginBottom: '12px', fontSize: '1.1rem' }}>✗ IS NOT</p>
                {['Legal advice', 'HR certification', 'Attorney replacement'].map((item, i) => (
                  <p key={i} style={{ color: '#555', margin: '8px 0' }}>{item}</p>
                ))}
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section style={{ padding: '48px 24px', backgroundColor: '#0f0f0f' }}>
            <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#fff', marginBottom: '24px' }}>FAQ</h2>
              {[
                { q: "I'm not an HR expert. Will I understand this?", a: "If you can answer yes, no, or not sure, you can do this. Plain English questions, clear next steps in the report." },
                { q: "Isn't this just a free checklist?", a: "Free checklists tell you WHAT to check. Our AI report tells you WHERE you're vulnerable and HOW to prioritize based on YOUR answers. That's a consultant's job." },
                { q: "What if I don't have time right now?", a: "under 10 minutes. Start today, finish tomorrow. Your access never expires. Report generates instantly when done." },
                { q: "Is my business too small for this?", a: "If you have employees, you have risk. Small businesses are the #1 target precisely BECAUSE they think they're too small to matter." },
                { q: "How is this different from hiring a consultant?", a: "Consultants charge $5,000+ and take weeks. This gives you 80% of that value in under 10 minutes for $29.99. For most small businesses, that's enough to find and prioritize your biggest gaps." }
              ].map((faq, i) => (
                <div key={i} style={{ borderBottom: '1px solid #252525', padding: '20px 0', textAlign: 'center' }}>
                  <h3 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 600, marginBottom: '8px' }}>{faq.q}</h3>
                  <p style={{ color: '#666', fontSize: '1rem', margin: 0, lineHeight: 1.6 }}>{faq.a}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Final CTA */}
          <section style={{ padding: '60px 24px', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 600, color: '#fff', marginBottom: '32px', lineHeight: 1.4 }}>Know where you stand, on your schedule, at your pace.</h2>
            <button onClick={() => setCurrentStep('business')} style={{ display: 'inline-block', backgroundColor: colors.primary, color: '#fff', padding: '18px 40px', fontSize: '1.15rem', fontWeight: 600, borderRadius: '8px', border: 'none', cursor: 'pointer', boxShadow: '0 4px 24px rgba(37,99,235,0.35)', fontFamily: 'inherit' }}>
              Start Free Assessment →
            </button>
            <p style={{ fontSize: '1rem', color: '#555', marginTop: '16px' }}>Free preview • Full report: <span style={{ color: colors.primary, fontWeight: 600 }}>$29.99</span> • ~10 min</p>
          </section>

          {/* Disclaimer */}
          <div style={{ padding: '20px 24px', backgroundColor: 'rgba(37,99,235,0.05)', borderTop: '1px solid rgba(37,99,235,0.1)', textAlign: 'center' }}>
            <p style={{ maxWidth: '600px', margin: '0 auto', fontSize: '0.9rem', color: '#555' }}>
              <span style={{ color: colors.primary }}>📋</span> Educational guidance only. Not a compliance certification or legal advice.
            </p>
          </div>

          {/* Footer */}
          <footer style={{ padding: '32px 24px', textAlign: 'center', borderTop: '1px solid #1a1a1a' }}>
            <p style={{ fontSize: '1rem', marginBottom: '8px' }}><span style={{ color: '#fff' }}>TechShield</span> <span style={{ color: colors.primary }}>KC LLC</span></p>
            <p style={{ fontSize: '0.9rem', color: '#444' }}>
              <a href="/privacy.html" style={{ color: '#444', marginRight: '16px', textDecoration: 'none' }}>Privacy</a>
              <a href="/terms.html" style={{ color: '#444', textDecoration: 'none' }}>Terms</a>
            </p>
            <p style={{ fontSize: '0.85rem', color: '#333', marginTop: '12px' }}>© 2026 HRShieldIQ™</p>
          </footer>

        </div>
      </div>
    );
  }

  // BUSINESS INFO SCREEN
  if (currentStep === 'business') {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', color: '#e5e5e5', fontFamily: "'Inter', system-ui, sans-serif", lineHeight: 1.6 }}>
        <style>{globalStyles}</style>
        <div style={{ maxWidth: '500px', margin: '0 auto', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
            <button onClick={() => setCurrentStep('intro')} style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', fontSize: '1rem', fontFamily: 'inherit', padding: 0 }}>← Back</button>
            <span style={{ color: '#555', fontSize: '0.9rem' }}>⏱️ Under 10 minutes</span>
          </div>

          <h1 style={{ fontSize: '1.75rem', fontWeight: 600, color: '#fff', marginBottom: '12px' }}>Personalize your report</h1>
          <p style={{ fontSize: '1.1rem', color: '#888', marginBottom: '24px' }}>We'll customize your report with <span style={{ color: '#fff' }}>industry specific risks</span> and benchmarks.</p>

          <div style={{ backgroundColor: '#141414', border: '1px solid #252525', borderRadius: '8px', padding: '16px', marginBottom: '32px' }}>
            <p style={{ fontSize: '0.95rem', color: '#999', margin: 0, lineHeight: 1.6 }}>
              <span style={{ color: colors.primary, fontWeight: 600 }}>HRShieldIQ™ Score:</span> 25 questions × 20 points each = <span style={{ color: '#fff', fontWeight: 600 }}>500 max</span>. Higher is better. Your score reflects HR compliance readiness based on DOL & EEOC guidelines.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '1rem', fontWeight: 500, color: '#fff', marginBottom: '8px' }}>Organization Name <span style={{ color: colors.primary }}>*</span></label>
              <input type="text" placeholder="Your Business Name" value={businessInfo.name} onChange={e => setBusinessInfo(prev => ({ ...prev, name: e.target.value }))} style={{ width: '100%', padding: '16px', fontSize: '1rem', backgroundColor: '#141414', border: '1px solid #252525', borderRadius: '8px', color: '#fff', outline: 'none', boxSizing: 'border-box' }} onFocus={e => e.target.style.borderColor = colors.primary} onBlur={e => e.target.style.borderColor = '#252525'} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '1rem', fontWeight: 500, color: '#fff', marginBottom: '8px' }}>Industry <span style={{ color: colors.primary }}>*</span></label>
              <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '8px', marginTop: 0 }}>This customizes your report with relevant compliance risks</p>
              <select value={businessInfo.industry} onChange={e => setBusinessInfo(prev => ({ ...prev, industry: e.target.value }))} style={{ width: '100%', padding: '16px', fontSize: '1rem', backgroundColor: '#141414', border: '1px solid #252525', borderRadius: '8px', color: businessInfo.industry ? '#fff' : '#666', outline: 'none', cursor: 'pointer', boxSizing: 'border-box' }} onFocus={e => e.target.style.borderColor = colors.primary} onBlur={e => e.target.style.borderColor = '#252525'}>
                <option value="">Select your industry...</option>
                <option value="Construction / Trades">Construction / Trades</option>
                <option value="Daycare / Childcare">Daycare / Childcare</option>
                <option value="Education / School">Education / School</option>
                <option value="Financial Services">Financial Services</option>
                <option value="Funeral Home / Mortuary">Funeral Home / Mortuary</option>
                <option value="Healthcare / Medical">Healthcare / Medical</option>
                <option value="Hospitality / Restaurant">Hospitality / Restaurant</option>
                <option value="Manufacturing">Manufacturing</option>
                <option value="Nonprofit / Association">Nonprofit / Association</option>
                <option value="Professional Services">Professional Services</option>
                <option value="Real Estate">Real Estate</option>
                <option value="Religious Organization">Religious Organization</option>
                <option value="Retail / E-commerce">Retail / E-commerce</option>
                <option value="Technology / IT">Technology / IT</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '1rem', fontWeight: 500, color: '#fff', marginBottom: '8px' }}>Organization Size <span style={{ color: colors.primary }}>*</span></label>
              <select value={businessInfo.size} onChange={e => setBusinessInfo(prev => ({ ...prev, size: e.target.value }))} style={{ width: '100%', padding: '16px', fontSize: '1rem', backgroundColor: '#141414', border: '1px solid #252525', borderRadius: '8px', color: businessInfo.size ? '#fff' : '#666', outline: 'none', cursor: 'pointer', boxSizing: 'border-box' }} onFocus={e => e.target.style.borderColor = colors.primary} onBlur={e => e.target.style.borderColor = '#252525'}>
                <option value="">Select size...</option>
                <option value="1-4 employees">1-4 employees</option>
                <option value="5-14 employees">5-14 employees</option>
                <option value="15-49 employees">15-49 employees (federal discrimination laws apply)</option>
                <option value="50-99 employees">50-99 employees (FMLA & healthcare law apply)</option>
                <option value="100+ employees">100+ employees</option>
              </select>
            </div>
          </div>

          <button onClick={() => setCurrentStep('questions')} disabled={!businessInfo.name.trim() || !businessInfo.industry || !businessInfo.size} style={{ width: '100%', marginTop: '32px', padding: '16px', fontSize: '1.1rem', fontWeight: 600, backgroundColor: (businessInfo.name.trim() && businessInfo.industry && businessInfo.size) ? colors.primary : '#333', color: (businessInfo.name.trim() && businessInfo.industry && businessInfo.size) ? '#fff' : '#666', border: 'none', borderRadius: '8px', cursor: (businessInfo.name.trim() && businessInfo.industry && businessInfo.size) ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>
            Start Assessment →
          </button>

          <p style={{ textAlign: 'center', fontSize: '0.85rem', color: '#555', marginTop: '16px' }}>🔒 Your info stays private. We never sell data.</p>
        </div>
      </div>
    );
  }

  // QUESTIONS SCREEN
  if (currentStep === 'questions') {
    return (
      <div style={baseStyles}>
        <style>{globalStyles}</style>
        <div style={{ maxWidth: '650px', margin: '0 auto' }}>
          {/* Progress */}
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ color: colors.gray, fontSize: '0.85rem' }}>{currentCategoryData.icon} {currentCategoryData.title}</span>
              <span style={{ color: colors.gray, fontSize: '0.85rem' }}>{answeredQuestions}/{totalQuestions}</span>
            </div>
            <div style={{ height: '3px', background: colors.darkCard, borderRadius: '100px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(answeredQuestions / totalQuestions) * 100}%`, background: colors.primary, borderRadius: '100px', transition: 'width 0.3s ease' }} />
            </div>
          </div>

          {/* Reassurance */}
          <div style={{ background: colors.darkCard, border: `1px solid ${colors.grayDark}22`, borderRadius: '8px', padding: '0.875rem 1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            <span style={{ fontSize: '1rem', flexShrink: 0 }}>💡</span>
            <p style={{ fontSize: '0.85rem', color: colors.gray, lineHeight: 1.5, margin: 0 }}>
              <strong style={{ color: colors.grayLight }}>Answer as best you can.</strong> If you're unsure, select "Not sure" — we'll flag it as an area to investigate.
            </p>
          </div>
          
          {/* Category Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
            {categories.map((cat, i) => {
              const catAnswered = cat.questions.filter(q => answers[q.id]).length;
              const catComplete = catAnswered === cat.questions.length;
              return (
                <button key={cat.id} onClick={() => setCurrentCategory(i)} style={{ background: currentCategory === i ? colors.primaryLight : colors.darkCard, border: `1px solid ${currentCategory === i ? colors.primaryBorder : 'transparent'}`, borderRadius: '100px', padding: '0.4rem 0.9rem', color: currentCategory === i ? colors.primary : colors.gray, cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.8rem', fontWeight: 500, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  {cat.icon} {cat.title}
                  {catComplete && <span style={{ color: '#22c55e' }}>✓</span>}
                </button>
              );
            })}
          </div>
          
          {/* Questions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {currentCategoryData.questions.map((question, qIndex) => (
              <div key={question.id} style={{ background: colors.darkCard, border: `1px solid ${colors.grayDark}22`, borderRadius: '12px', padding: '1.25rem' }}>
                <p style={{ marginBottom: '0.5rem', fontWeight: 500, lineHeight: 1.5, fontSize: '0.95rem' }}>{qIndex + 1}. {question.text}</p>
                {question.helper && (
                  <p style={{ fontSize: '0.8rem', color: colors.gray, marginBottom: '1rem', lineHeight: 1.5, paddingLeft: '0.5rem', borderLeft: `2px solid ${colors.grayDark}44` }}>{question.helper}</p>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {question.options.map((option, optIndex) => {
                    const isSelected = answers[question.id] === option;
                    return (
                      <button key={optIndex} onClick={() => handleAnswer(question.id, option)} style={{ width: '100%', textAlign: 'left', padding: '0.75rem 1rem', background: isSelected ? colors.primaryLight : 'transparent', border: `1px solid ${isSelected ? colors.primary : colors.grayDark}44`, borderRadius: '8px', color: isSelected ? colors.white : colors.grayLight, cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.9rem', transition: 'all 0.15s ease' }}>
                        <span style={{ display: 'inline-block', width: '18px', height: '18px', borderRadius: '50%', border: `2px solid ${isSelected ? colors.primary : colors.grayDark}`, marginRight: '0.75rem', verticalAlign: 'middle', background: isSelected ? colors.primary : 'transparent', position: 'relative' }}>
                          {isSelected && <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: colors.white, fontSize: '10px' }}>✓</span>}
                        </span>
                        {option}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          
          {/* Navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem', gap: '1rem' }}>
            <button onClick={() => currentCategory > 0 ? setCurrentCategory(currentCategory - 1) : setCurrentStep('business')} style={{ background: 'transparent', border: `1px solid ${colors.grayDark}`, borderRadius: '8px', padding: '0.75rem 1.5rem', color: colors.grayLight, cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.9rem' }}>
              ← Back
            </button>
            
            {currentCategory < categories.length - 1 ? (
              <button onClick={() => setCurrentCategory(currentCategory + 1)} disabled={!allQuestionsAnswered} style={{ background: allQuestionsAnswered ? colors.primary : colors.darkCard, border: 'none', borderRadius: '8px', padding: '0.75rem 1.5rem', color: allQuestionsAnswered ? colors.white : colors.grayDark, cursor: allQuestionsAnswered ? 'pointer' : 'not-allowed', fontFamily: 'inherit', fontSize: '0.9rem', fontWeight: 600 }}>
                {allQuestionsAnswered ? 'Next Category →' : `Answer all ${currentCategoryData.questions.length} questions`}
              </button>
            ) : (
              <button onClick={() => setCurrentStep('preview')} disabled={answeredQuestions < totalQuestions} style={{ background: answeredQuestions >= totalQuestions ? colors.primary : colors.darkCard, border: 'none', borderRadius: '8px', padding: '0.75rem 1.5rem', color: answeredQuestions >= totalQuestions ? colors.white : colors.grayDark, cursor: answeredQuestions >= totalQuestions ? 'pointer' : 'not-allowed', fontFamily: 'inherit', fontSize: '0.9rem', fontWeight: 600 }}>
                {answeredQuestions >= totalQuestions ? 'See My Results →' : `Answer all questions (${answeredQuestions}/${totalQuestions})`}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // PREVIEW SCREEN (only show if not loading)
  if (currentStep === 'preview' && !loading) {
    const { highRisk, mediumRisk, lowRisk, iqScore } = calculateRiskScore();
    const displayData = pendingReport ? { critical: pendingReport.criticalCount || highRisk, attention: pendingReport.attentionCount || mediumRisk, good: pendingReport.goodCount || lowRisk } : { critical: highRisk, attention: mediumRisk, good: lowRisk };

    return (
      <div style={baseStyles}>
        <style>{globalStyles}</style>
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem 1rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: colors.primary, marginBottom: '0.5rem' }}>Assessment Complete!</h1>
            <p style={{ color: colors.gray, fontSize: '0.9rem' }}>{businessInfo.name}</p>
          </div>

          {/* Locked Score Card */}
          <div style={{ background: colors.darkCard, borderRadius: '16px', padding: '2rem', textAlign: 'center', marginBottom: '1.5rem', border: `2px solid ${colors.primary}`, position: 'relative' }}>
            <div style={{ fontSize: '4rem', fontWeight: 700, color: colors.primary, filter: 'blur(8px)' }}>{pendingReport?.score || iqScore || 324}</div>
            <div style={{ color: colors.gray, fontSize: '1rem', marginBottom: '1rem', filter: 'blur(4px)' }}>out of 500</div>
            <div style={{ display: 'inline-block', background: '#f59e0b', color: 'white', padding: '0.5rem 1.5rem', borderRadius: '20px', fontSize: '0.9rem', fontWeight: 600, filter: 'blur(4px)' }}>{pendingReport?.riskLevel || 'CALCULATING'}</div>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(0,0,0,0.8)', padding: '0.75rem 1.5rem', borderRadius: '8px', border: `1px solid ${colors.primary}` }}>
              <span style={{ fontSize: '1.5rem' }}>🔒</span>
              <span style={{ color: colors.white, marginLeft: '0.5rem', fontWeight: 600 }}>Unlock Your Score</span>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{ background: '#fee2e2', padding: '1rem 1.5rem', borderRadius: '10px', textAlign: 'center', minWidth: '100px' }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#dc2626' }}>{displayData.critical}</div>
              <div style={{ fontSize: '0.75rem', color: '#991b1b' }}>Critical</div>
            </div>
            <div style={{ background: '#fef3c7', padding: '1rem 1.5rem', borderRadius: '10px', textAlign: 'center', minWidth: '100px' }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f59e0b' }}>{displayData.attention}</div>
              <div style={{ fontSize: '0.75rem', color: '#92400e' }}>Attention</div>
            </div>
            <div style={{ background: '#d1fae5', padding: '1rem 1.5rem', borderRadius: '10px', textAlign: 'center', minWidth: '100px' }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#10b981' }}>{displayData.good}</div>
              <div style={{ fontSize: '0.75rem', color: '#065f46' }}>Good</div>
            </div>
          </div>

          {/* Sample Preview - BLURRED */}
          <div style={{ background: colors.darkCard, borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' }}>
            <h3 style={{ color: colors.white, fontSize: '1rem', marginBottom: '1rem' }}>📋 Sample from your report:</h3>
            <div style={{ position: 'relative' }}>
              <div style={{ filter: 'blur(3px)', pointerEvents: 'none' }}>
                <div style={{ background: colors.darkBg, padding: '0.75rem', borderRadius: '8px', marginBottom: '0.5rem', borderLeft: '3px solid #dc2626' }}>
                  <span style={{ color: '#dc2626', fontWeight: 600 }}>Critical:</span>
                  <span style={{ color: colors.gray }}> Your I-9 storage practices need immediate attention to avoid ICE audit penalties...</span>
                </div>
                <div style={{ background: colors.darkBg, padding: '0.75rem', borderRadius: '8px', marginBottom: '0.5rem', borderLeft: '3px solid #f59e0b' }}>
                  <span style={{ color: '#f59e0b', fontWeight: 600 }}>Attention:</span>
                  <span style={{ color: colors.gray }}> Performance documentation should be formalized with written records...</span>
                </div>
                <div style={{ background: colors.darkBg, padding: '0.75rem', borderRadius: '8px', borderLeft: '3px solid #10b981' }}>
                  <span style={{ color: '#10b981', fontWeight: 600 }}>Strong:</span>
                  <span style={{ color: colors.gray }}> Workers' compensation insurance is properly maintained and current...</span>
                </div>
              </div>
            </div>
          </div>

          {/* What's in the Report */}
          <div style={{ background: colors.primaryLight, border: `1px solid ${colors.primaryBorder}`, borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem', textAlign: 'center' }}>
            <p style={{ fontWeight: 600, color: colors.white, marginBottom: '0.75rem', fontSize: '0.95rem' }}>Your personalized report includes:</p>
            <div style={{ fontSize: '0.9rem', color: colors.grayLight, lineHeight: 1.9 }}>
              <div><span style={{ color: colors.primary }}>✓</span> Your exact HRShieldIQ™ score</div>
              <div><span style={{ color: colors.primary }}>✓</span> Detailed analysis of all 25 compliance areas</div>
              <div><span style={{ color: colors.primary }}>✓</span> Specific risks for {businessInfo.industry || 'your'} organizations</div>
              <div><span style={{ color: colors.primary }}>✓</span> Step-by-step fix instructions with time estimates</div>
              <div><span style={{ color: colors.primary }}>✓</span> 30-day action plan prioritized by impact</div>
              <div><span style={{ color: colors.primary }}>✓</span> PDF download for your records</div>
            </div>
          </div>

          {/* Unlock Button */}
          <button onClick={() => setShowPaywall(true)} style={{ width: '100%', background: colors.primary, border: 'none', borderRadius: '10px', padding: '1rem', color: colors.white, cursor: 'pointer', fontFamily: 'inherit', fontSize: '1.1rem', fontWeight: 600, boxShadow: `0 4px 20px ${colors.primary}40`, marginBottom: '1rem' }}>
            🔓 Unlock Full Report $29.99
          </button>
          <p style={{ textAlign: 'center', color: colors.grayDark, fontSize: '0.75rem' }}>One-time purchase • Instant access • PDF download included</p>
          
          <div style={{ textAlign: 'center', marginTop: '2rem', paddingTop: '1rem', borderTop: `1px solid ${colors.grayDark}33` }}>
            <p style={{ fontSize: '0.7rem', color: colors.grayDark }}>
              <a href="/privacy.html" style={{ color: colors.grayDark, textDecoration: 'none', marginRight: '1rem' }}>Privacy Policy</a>
              <a href="/terms.html" style={{ color: colors.grayDark, textDecoration: 'none' }}>Terms of Service</a>
            </p>
          </div>
        </div>

        {/* Paywall Modal */}
        {showPaywall && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '0.5rem', overflowY: 'auto' }}>
            <div style={{ background: colors.black, borderRadius: '16px', padding: 'clamp(1rem, 4vw, 2rem)', maxWidth: '450px', width: '100%', maxHeight: '95vh', overflowY: 'auto', border: `1px solid ${colors.grayDark}33`, margin: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: colors.white }}>Unlock Your Report</h2>
                <button onClick={() => setShowPaywall(false)} style={{ background: 'none', border: 'none', color: colors.gray, cursor: 'pointer', fontSize: '1.5rem' }}>×</button>
              </div>

              {/* Summary */}
              <div style={{ background: colors.darkCard, borderRadius: '10px', padding: '1rem', marginBottom: '1.5rem' }}>
                <p style={{ color: colors.gray, fontSize: '0.85rem', textAlign: 'center', marginBottom: '0.5rem' }}>We found issues in your assessment:</p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem' }}>
                  <div style={{ textAlign: 'center' }}><span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#dc2626' }}>{displayData.critical}</span><span style={{ fontSize: '0.7rem', color: colors.gray, display: 'block' }}>Critical</span></div>
                  <div style={{ textAlign: 'center' }}><span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f59e0b' }}>{displayData.attention}</span><span style={{ fontSize: '0.7rem', color: colors.gray, display: 'block' }}>Attention</span></div>
                  <div style={{ textAlign: 'center' }}><span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#10b981' }}>{displayData.good}</span><span style={{ fontSize: '0.7rem', color: colors.gray, display: 'block' }}>Good</span></div>
                </div>
              </div>

              {/* Plan Selection */}
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ fontSize: '0.8rem', color: colors.gray, marginBottom: '0.5rem' }}>Select your plan:</p>
                
                <div onClick={() => setSelectedPlan('onetime')} style={{ background: selectedPlan === 'onetime' ? colors.primaryLight : colors.darkCard, border: `2px solid ${selectedPlan === 'onetime' ? colors.primary : colors.grayDark}`, borderRadius: '10px', padding: '1rem', marginBottom: '0.5rem', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: `2px solid ${selectedPlan === 'onetime' ? colors.primary : colors.grayDark}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {selectedPlan === 'onetime' && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: colors.primary }} />}
                      </div>
                      <div><span style={{ color: colors.white, fontWeight: 600 }}>One-Time Report</span><span style={{ color: colors.gray, fontSize: '0.8rem', display: 'block' }}>Full assessment with PDF</span></div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      {appliedDiscount > 0 && appliedDiscount < 100 && <span style={{ color: colors.gray, textDecoration: 'line-through', fontSize: '0.8rem', display: 'block' }}>$29.99</span>}
                      <span style={{ color: colors.primary, fontWeight: 700, fontSize: '1.1rem' }}>${discountedPrice.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Email */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.85rem', color: colors.grayLight, marginBottom: '0.35rem', display: 'block' }}>Email for report delivery <span style={{ color: colors.primary }}>*</span></label>
                <input type="email" placeholder="you@company.com" value={businessInfo.email} onChange={e => setBusinessInfo(prev => ({ ...prev, email: e.target.value }))} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: `1px solid ${colors.grayDark}`, background: colors.darkCard, color: colors.white, fontFamily: 'inherit', fontSize: '1rem', boxSizing: 'border-box' }} />
              </div>

              {/* Promo Code */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input 
                    type="text" 
                    value={promoCode} 
                    onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setPromoError(''); }} 
                    onKeyDown={async (e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (!businessInfo.email || !businessInfo.email.includes('@')) { setPromoError('Enter email first'); return; }
                        if (!promoCode.trim()) { return; }
                        try {
                          const response = await fetch('/api/validate-promo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: promoCode }) });
                          const data = await response.json();
                          if (data.valid) {
                            setAppliedDiscount(data.discount);
                            setDiscountedPrice(data.finalPrice);
                            if (data.discount === 100) {
                              setPromoError('');
                              setPaymentComplete(true);
                              setShowPaywall(false);
                              setLoading(true);
                              const generatedReport = await startBackgroundReportGeneration();
                              if (generatedReport) {
                                setReport(generatedReport);
                                setCurrentStep('report');
                                setLoading(false);
                                if (businessInfo.email) {
                                  sendReportEmail(businessInfo.email, generatedReport);
                                }
                              }
                            } else {
                              setPromoError(`✓ ${data.discount}% off! Pay $${data.finalPrice.toFixed(2)}`);
                            }
                          } else {
                            setPromoError('Invalid code');
                          }
                        } catch (error) {
                          console.error('Promo code error:', error);
                          setPromoError('Error validating code');
                        }
                      }
                    }}
                    placeholder="Promo code (optional)" 
                    style={{ flex: 1, padding: '0.6rem 0.75rem', borderRadius: '6px', border: `1px solid ${colors.grayDark}`, background: colors.darkCard, color: colors.white, fontFamily: 'inherit', fontSize: '0.85rem' }} 
                  />
                  <button onClick={async () => {
                    if (!businessInfo.email || !businessInfo.email.includes('@')) { setPromoError('Enter email first'); return; }
                    if (!promoCode.trim()) { return; }
                    try {
                      const response = await fetch('/api/validate-promo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: promoCode }) });
                      const data = await response.json();
                      if (data.valid) {
                        setAppliedDiscount(data.discount);
                        setDiscountedPrice(data.finalPrice);
                        if (data.discount === 100) {
                          setPromoError('');
                          setPaymentComplete(true);
                          setShowPaywall(false);
                          await generateReport();
                        } else {
                          setPromoError(`✓ ${data.discount}% off! Pay $${data.finalPrice.toFixed(2)}`);
                        }
                      } else {
                        setPromoError('Invalid code');
                      }
                    } catch (error) {
                      setPromoError('Error validating code');
                    }
                  }} style={{ background: colors.primary, border: 'none', borderRadius: '6px', padding: '0.6rem 1rem', color: colors.white, cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.85rem', fontWeight: 600 }}>
                    Apply
                  </button>
                </div>
                {promoError && <p style={{ color: promoError.startsWith('✓') ? '#22c55e' : '#dc2626', fontSize: '0.75rem', marginTop: '0.25rem', fontWeight: promoError.startsWith('✓') ? 600 : 400 }}>{promoError}</p>}
              </div>

              {/* PayPal Button */}
              <div ref={paypalRef} style={{ marginBottom: '0.5rem', minHeight: '150px', opacity: businessInfo.email && businessInfo.email.includes('@') ? 1 : 0.5, pointerEvents: businessInfo.email && businessInfo.email.includes('@') ? 'auto' : 'none', display: paypalLoading ? 'none' : 'block' }}></div>
              
              {paypalLoading && businessInfo.email && businessInfo.email.includes('@') && (
                <div style={{ textAlign: 'center', padding: '2rem', minHeight: '150px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: '30px', height: '30px', border: `3px solid ${colors.darkCard}`, borderTop: `3px solid ${colors.primary}`, borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '0.75rem' }} />
                  <p style={{ fontSize: '0.85rem', color: colors.gray }}>Loading payment options...</p>
                  <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                </div>
              )}

              {!businessInfo.email || !businessInfo.email.includes('@') ? (
                <p style={{ textAlign: 'center', fontSize: '0.75rem', color: colors.primary, marginBottom: '0.35rem' }}>↑ Enter email to continue</p>
              ) : null}
              
              <p style={{ textAlign: 'center', fontSize: '0.7rem', color: colors.grayDark }}>
                Secure payment via PayPal • <a href="mailto:info@techshieldkc.com" style={{ color: colors.gray }}>Questions?</a>
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // LOADING SCREEN
  if (loading && currentStep !== 'report') {
    return (
      <div style={{ ...baseStyles, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', minHeight: '100vh' }}>
        <style>{`${globalStyles} @keyframes spin { to { transform: rotate(360deg); } } @keyframes bounce { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }`}</style>
        <div style={{ width: '70px', height: '70px', border: `5px solid ${colors.darkCard}`, borderTopColor: colors.primary, borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '2rem' }} />
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', color: colors.white }}>Building Your Report</h2>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem' }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ width: '12px', height: '12px', backgroundColor: colors.primary, borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: `${i * 0.16}s` }} />
          ))}
        </div>
        <p style={{ color: colors.gray, fontSize: '0.95rem', marginBottom: '0.5rem' }}>Analyzing your {businessInfo.industry || 'business'} compliance...</p>
        <p style={{ color: colors.grayDark, fontSize: '0.85rem' }}>This usually takes 10-15 seconds</p>
      </div>
    );
  }

  // REPORT SCREEN
  if (currentStep === 'report' && report) {
    const downloadPdf = () => {
      setReportSaved(true);
      const reportWindow = window.open('', '_blank');
      if (!reportWindow) { alert('Please allow popups to download your PDF report'); return; }
      
      const r = report;
      const safeBusinessName = escapeHtml(businessInfo.name);
      const safeIndustry = escapeHtml(businessInfo.industry);
      const reportDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      const reassessDate = new Date(Date.now() + 90*24*60*60*1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      
      const riskColor = r.riskLevel === 'HIGH RISK' ? '#dc2626' : r.riskLevel === 'ELEVATED RISK' ? '#f59e0b' : r.riskLevel === 'MODERATE' ? '#3b82f6' : '#10b981';
      const score = r.score || 0;
      
      // Industry averages and stats with sources
      const industryData = {
        'Healthcare / Medical': { avg: 285, stat: 'Healthcare employers face 30% more wage & hour lawsuits than other industries.', source: 'DOL Wage & Hour Division Enforcement Data', exposure: '$50,000+' },
        'Religious Organization': { avg: 275, stat: 'Religious organizations face unique compliance challenges with ministerial exceptions and volunteer classification.', source: 'EEOC Religious Discrimination Guidance', exposure: '$35,000+' },
        'Daycare / Childcare': { avg: 280, stat: 'Childcare facilities face strict background check and ratio requirements with penalties up to $10,000 per violation.', source: 'State Childcare Licensing Boards', exposure: '$40,000+' },
        'Hospitality / Restaurant': { avg: 265, stat: 'Restaurants pay $1.9 billion annually in wage & hour settlements—tip credit and overtime are top violations.', source: 'DOL Wage & Hour Division', exposure: '$45,000+' },
        'Retail / E-commerce': { avg: 270, stat: 'Retail faces high turnover and scheduling compliance issues with predictive scheduling laws in many states.', source: 'National Retail Federation', exposure: '$35,000+' },
        'Construction / Trades': { avg: 270, stat: 'Construction employers face 40% higher OSHA inspection rates and Davis-Bacon Act scrutiny on federal projects.', source: 'OSHA Enforcement Data', exposure: '$55,000+' },
        'Professional Services': { avg: 305, stat: 'Professional services firms face increased DOL audits for exempt employee misclassification.', source: 'DOL Wage & Hour Division', exposure: '$40,000+' },
        'Manufacturing': { avg: 290, stat: 'Manufacturing sees 25% of all OSHA violations with average penalties of $15,000 per serious violation.', source: 'OSHA Statistics', exposure: '$60,000+' },
        'Nonprofit / Association': { avg: 295, stat: 'Nonprofits face unique risks with volunteer vs. employee classification—misclassification penalties start at $50 per worker.', source: 'Internal Revenue Service (IRS) & DOL Guidelines', exposure: '$30,000+' },
        'Education / School': { avg: 280, stat: '58.3% of K-12 DOL investigations find FLSA violations—one district faced $1.5M+ in back wages from a single audit.', source: 'DOL Wage & Hour Division', exposure: '$45,000+' },
        'Funeral Home / Mortuary': { avg: 285, stat: 'Funeral home OSHA fines can reach $161,323 for serious violations—bloodborne pathogen and formaldehyde exposure are common citations.', source: 'OSHA / National Funeral Directors Association (NFDA)', exposure: '$50,000+' },
        'Financial Services': { avg: 300, stat: 'Financial services face heightened scrutiny for overtime exemption misclassification of analysts and advisors.', source: 'DOL Wage & Hour Division', exposure: '$45,000+' },
        'Real Estate': { avg: 290, stat: 'Real estate faces significant misclassification risk—agent/employee status lawsuits have increased dramatically in recent years.', source: 'DOL & State Real Estate Commissions', exposure: '$40,000+' },
        'Technology / IT': { avg: 295, stat: 'Up to 30% of tech employers misclassify workers as contractors—startups face high exposure for back wages and benefits.', source: 'DOL Misclassification Initiative', exposure: '$50,000+' },
        'Other': { avg: 285, stat: 'Small businesses face an average of $125,000 in legal costs per employment lawsuit.', source: 'Hiscox Employment Practices Liability Report', exposure: '$45,000+' }
      };
      const indData = industryData[businessInfo.industry] || industryData['Other'];
      const allAvg = 310;
      const compareMsg = score > indData.avg ? "✓ You're above average for your industry!" : score > indData.avg - 30 ? "You're close to industry average" : "⚠️ Below industry average - prioritize improvements";
      
      // Category scores (simulated based on answers - in production this would come from actual scoring)
      const catScores = {
        hiring: Math.min(100, Math.round((r.goodCount / 25) * 100 + Math.random() * 20)),
        wage: Math.min(100, Math.round((r.goodCount / 25) * 85 + Math.random() * 20)),
        policies: Math.min(100, Math.round((r.goodCount / 25) * 90 + Math.random() * 20)),
        documentation: Math.max(20, Math.round((r.goodCount / 25) * 70 + Math.random() * 20)),
        termination: Math.min(100, Math.round((r.goodCount / 25) * 95 + Math.random() * 20))
      };
      
      // Cost analysis
      const fixCost = r.criticalCount * 500 + r.attentionCount * 200;
      
      // Generate priorities HTML
      const prioritiesHtml = (r.priorities || []).map((p, i) => 
        `<div class="priority-box"><h4>${i+1}. ${escapeHtml(p.title || '')}</h4><p>${escapeHtml(p.reason || '')}</p></div>`
      ).join('');
      
      // Generate critical issues HTML with enhanced layout
      const criticalHtml = (r.criticalIssues || []).length > 0 ? '<h2>Critical Issues</h2>' + r.criticalIssues.map((issue, idx) => 
        `<div class="issue-card critical">
          <div class="issue-header">
            <div class="issue-title">${escapeHtml(issue.topic || '')}</div>
            <div class="issue-meta">
              <span class="badge critical">CRITICAL</span>
              ${idx === 0 ? '<span class="badge priority">FIX FIRST</span>' : ''}
            </div>
          </div>
          <div class="your-answer">
            <div class="your-answer-label">Your Answer</div>
            <div class="your-answer-text">"${escapeHtml(issue.answer || 'See details')}"</div>
          </div>
          <div class="issue-details">
            <div class="detail-box risk"><div class="detail-label">⚠️ Risk</div><div class="detail-text">${escapeHtml(issue.risk || '')}</div></div>
            <div class="detail-box penalty"><div class="detail-label">💰 Potential Exposure</div><div class="detail-text" style="font-weight:600;color:#dc2626;">Varies by violation</div></div>
            <div class="detail-box fix"><div class="detail-label">✅ Recommended Action</div><div class="detail-text">${escapeHtml(issue.fix || '')}</div></div>
            <div class="detail-box effort"><div class="detail-label">⏱️ Estimated Effort</div><div class="detail-text">${escapeHtml(issue.effort || '')}</div></div>
          </div>
        </div>`
      ).join('') : '';
      
      // Generate attention issues HTML
      const attentionHtml = (r.attentionIssues || []).length > 0 ? '<h2>Items Needing Attention</h2>' + r.attentionIssues.map(issue => 
        `<div class="issue-card attention">
          <div class="issue-header">
            <div class="issue-title">${escapeHtml(issue.topic || '')}</div>
            <span class="badge attention">ATTENTION</span>
          </div>
          <div class="your-answer">
            <div class="your-answer-label">Your Answer</div>
            <div class="your-answer-text">"${escapeHtml(issue.answer || 'See details')}"</div>
          </div>
          <div class="issue-details half">
            <div class="detail-box fix"><div class="detail-label">✅ Recommended Action</div><div class="detail-text">${escapeHtml(issue.fix || '')}</div></div>
            <div class="detail-box effort"><div class="detail-label">⏱️ Estimated Effort</div><div class="detail-text">${escapeHtml(issue.effort || '')}</div></div>
          </div>
        </div>`
      ).join('') : '';
      
      // Generate good practices HTML with point values
      const goodHtml = (r.goodPractices || []).length > 0 ? 
        `<div class="good-section"><h3>✓ Good Practices Already in Place (${r.goodCount || r.goodPractices.length})</h3><div class="good-grid">` + 
        r.goodPractices.map(p => `<div class="good-item"><span class="check">✓</span><span class="good-text">${escapeHtml(typeof p === 'string' ? p : (p.practice || ''))}</span><span class="good-value">+20</span></div>`).join('') + 
        '</div></div>' : '';
      
      // Generate action plan with checkboxes
      const week1Tasks = (r.actionPlan?.week1 || ['Review critical issues', 'Create I-9 folder', 'Order posters']).map(t => 
        `<div class="action-item"><div class="action-checkbox"></div><div class="action-content"><div class="action-task">${escapeHtml(t)}</div></div></div>`
      ).join('');
      const week2Tasks = (r.actionPlan?.week2to4 || ['Schedule handbook review', 'Set up training']).map(t => 
        `<div class="action-item"><div class="action-checkbox"></div><div class="action-content"><div class="action-task">${escapeHtml(t)}</div></div></div>`
      ).join('');
      const ongoingTasks = (r.actionPlan?.ongoing || ['Document performance issues', 'Quarterly reviews']).map(t => 
        `<div class="action-item"><div class="action-checkbox"></div><div class="action-content"><div class="action-task">${escapeHtml(t)}</div></div></div>`
      ).join('');

      const htmlContent = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>HRShieldIQ Report - ${safeBusinessName}</title>
<link href="https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:Merriweather,Georgia,serif;max-width:900px;margin:0 auto;padding:40px;background:#fff;color:#333;line-height:1.8;font-size:11pt;}
.download-bar{font-family:Inter,sans-serif;background:#2563EB;color:white;padding:15px 20px;margin:-40px -40px 30px -40px;display:flex;justify-content:space-between;align-items:center;}
.download-bar button{background:white;color:#2563EB;border:none;padding:10px 25px;border-radius:6px;font-weight:600;cursor:pointer;font-size:14px;font-family:Inter,sans-serif;}
.header{text-align:center;margin-bottom:30px;padding-bottom:25px;border-bottom:3px solid #2563EB;}
.logo{font-family:Inter,sans-serif;font-size:32px;font-weight:bold;margin-bottom:5px;}
.logo span{color:#2563EB;}
h2{font-family:Inter,sans-serif;color:#1e40af;font-size:16pt;margin:30px 0 15px;padding-bottom:8px;border-bottom:2px solid #2563EB;text-align:center;}
h3{font-family:Inter,sans-serif;color:#333;font-size:13pt;margin:20px 0 10px;}
.score-section{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin:25px 0;}
.score-box{background:#eff6ff;border:3px solid #2563EB;padding:25px;border-radius:12px;text-align:center;}
.score-number{font-family:Inter,sans-serif;font-size:42pt;font-weight:bold;color:#2563EB;}
.score-label{font-size:12pt;color:#666;}
.risk-level{font-family:Inter,sans-serif;display:inline-block;background:${riskColor};color:white;padding:6px 16px;border-radius:20px;font-weight:600;margin-top:10px;font-size:11pt;}
.score-comparison{background:#f8fafc;border:2px solid #e2e8f0;padding:20px;border-radius:12px;}
.comparison-item{display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #e2e8f0;}
.comparison-item:last-child{border-bottom:none;}
.comparison-label{color:#64748b;font-size:10pt;}
.comparison-value{font-family:Inter,sans-serif;font-weight:600;color:#334155;}
.comparison-bar{height:8px;background:#e2e8f0;border-radius:4px;margin-top:4px;overflow:hidden;}
.comparison-fill{height:100%;border-radius:4px;}
.compare-msg{font-size:9pt;text-align:center;margin-top:12px;font-weight:600;}
.compare-good{color:#10b981;}
.compare-ok{color:#f59e0b;}
.compare-low{color:#dc2626;}
.category-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin:20px 0;}
.category-item{text-align:center;padding:15px 10px;border-radius:10px;background:#f8fafc;border:1px solid #e2e8f0;}
.category-score{font-family:Inter,sans-serif;font-size:20pt;font-weight:bold;}
.category-max{font-size:9pt;color:#94a3b8;}
.category-name{font-size:9pt;color:#64748b;margin-top:5px;}
.cat-good .category-score{color:#10b981;}
.cat-ok .category-score{color:#f59e0b;}
.cat-bad .category-score{color:#dc2626;}
.summary-table{display:flex;justify-content:center;gap:20px;margin:20px 0;flex-wrap:wrap;}
.summary-item{text-align:center;padding:15px 25px;border-radius:8px;min-width:110px;}
.summary-item.critical{background:#fee2e2;}
.summary-item.attention{background:#fef3c7;}
.summary-item.good{background:#d1fae5;}
.summary-item .num{font-family:Inter,sans-serif;font-size:24pt;font-weight:bold;}
.summary-item.critical .num{color:#dc2626;}
.summary-item.attention .num{color:#f59e0b;}
.summary-item.good .num{color:#10b981;}
.summary-item .label{font-size:9pt;color:#666;}
.cost-analysis{background:linear-gradient(135deg,#fef2f2 0%,#fee2e2 100%);border:2px solid #dc2626;border-radius:12px;padding:25px;margin:25px 0;}
.cost-analysis h3{color:#991b1b;margin:0 0 15px;text-align:center;font-family:Inter,sans-serif;}
.cost-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;}
.cost-box{background:white;padding:18px;border-radius:8px;text-align:center;}
.cost-box.risk{border:2px solid #dc2626;}
.cost-box.invest{border:2px solid #10b981;}
.cost-amount{font-family:Inter,sans-serif;font-size:24pt;font-weight:bold;}
.cost-box.risk .cost-amount{color:#dc2626;}
.cost-box.invest .cost-amount{color:#10b981;}
.cost-label{font-size:10pt;color:#666;margin-top:5px;}
.cost-detail{font-size:9pt;color:#888;margin-top:8px;}
.cost-note{text-align:center;margin-top:15px;font-size:10pt;color:#991b1b;font-weight:500;}
.priority-box{background:#eff6ff;border-left:4px solid #2563EB;padding:18px;margin:12px auto;border-radius:0 8px 8px 0;max-width:700px;}
.priority-box h4{font-family:Inter,sans-serif;color:#2563EB;margin-bottom:6px;text-align:center;}
.priority-box p{text-align:center;font-size:10.5pt;margin:0;}
.issue-card{background:#fafafa;border-radius:12px;padding:24px;margin:20px 0;border:2px solid #e5e5e5;}
.issue-card.critical{border-color:#dc2626;border-top:6px solid #dc2626;}
.issue-card.attention{border-color:#f59e0b;border-top:6px solid #f59e0b;}
.issue-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:15px;flex-wrap:wrap;gap:10px;}
.issue-title{font-family:Inter,sans-serif;font-weight:700;color:#333;font-size:14pt;}
.issue-meta{display:flex;gap:8px;align-items:center;}
.badge{font-family:Inter,sans-serif;padding:4px 12px;border-radius:12px;font-size:9pt;font-weight:600;}
.badge.critical{background:#fee2e2;color:#dc2626;}
.badge.attention{background:#fef3c7;color:#b45309;}
.badge.priority{background:#dbeafe;color:#1d4ed8;}
.your-answer{background:#f1f5f9;padding:12px 16px;border-radius:8px;margin:12px 0;border-left:4px solid #94a3b8;}
.your-answer-label{font-family:Inter,sans-serif;font-size:9pt;color:#64748b;text-transform:uppercase;font-weight:600;}
.your-answer-text{color:#334155;font-style:italic;margin-top:4px;}
.issue-details{display:grid;grid-template-columns:1fr 1fr;gap:15px;margin-top:15px;}
.issue-details.half{grid-template-columns:1fr 1fr;}
.detail-box{padding:15px;border-radius:8px;}
.detail-box.risk{background:#fff5f5;border:1px solid #fecaca;}
.detail-box.fix{background:#f0fdf4;border:1px solid #bbf7d0;}
.detail-box.penalty{background:#fefce8;border:1px solid #fef08a;}
.detail-box.effort{background:#f0f9ff;border:1px solid #bae6fd;}
.detail-label{font-family:Inter,sans-serif;font-weight:700;font-size:9pt;text-transform:uppercase;margin-bottom:6px;}
.detail-box.risk .detail-label{color:#dc2626;}
.detail-box.fix .detail-label{color:#16a34a;}
.detail-box.penalty .detail-label{color:#ca8a04;}
.detail-box.effort .detail-label{color:#0369a1;}
.detail-text{color:#444;font-size:10.5pt;line-height:1.6;}
.good-section{background:linear-gradient(135deg,#f0fdf4 0%,#dcfce7 100%);border:2px solid #10b981;border-radius:12px;padding:25px;margin:25px 0;}
.good-section h3{font-family:Inter,sans-serif;color:#10b981;margin-bottom:15px;text-align:center;}
.good-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
.good-item{display:flex;align-items:center;gap:10px;background:white;border:1px solid #10b981;border-radius:8px;padding:10px 14px;}
.good-item .check{color:#10b981;font-weight:bold;font-size:14pt;}
.good-text{font-size:10pt;color:#166534;flex:1;}
.good-value{font-family:Inter,sans-serif;font-size:9pt;color:#059669;font-weight:600;}
.action-plan{background:linear-gradient(135deg,#eff6ff 0%,#dbeafe 100%);border:2px solid #2563EB;padding:25px;border-radius:12px;margin:25px 0;}
.action-plan h2{border:none;margin:0 0 20px;color:#1e40af;}
.action-week{background:white;border-radius:10px;padding:20px;margin:12px 0;box-shadow:0 2px 8px rgba(0,0,0,0.05);}
.action-week h4{font-family:Inter,sans-serif;color:#2563EB;margin:0 0 12px;font-size:12pt;padding-bottom:8px;border-bottom:1px solid #bfdbfe;}
.action-item{display:flex;align-items:flex-start;gap:12px;padding:10px 0;border-bottom:1px solid #f1f5f9;}
.action-item:last-child{border-bottom:none;}
.action-checkbox{width:18px;height:18px;border:2px solid #2563EB;border-radius:4px;flex-shrink:0;margin-top:2px;}
.action-content{flex:1;}
.action-task{color:#333;font-size:10.5pt;}
.quick-ref{background:#1e293b;color:white;border-radius:12px;padding:25px;margin:25px 0;}
.quick-ref h3{font-family:Inter,sans-serif;color:#60a5fa;text-align:center;margin-bottom:15px;}
.quick-ref-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:15px;}
.quick-ref-item{background:#334155;padding:15px;border-radius:8px;text-align:center;}
.quick-ref-label{font-size:9pt;color:#94a3b8;margin-bottom:5px;}
.quick-ref-value{font-family:Inter,sans-serif;font-size:14pt;font-weight:bold;color:#60a5fa;}
.quick-ref-note{font-size:8pt;color:#94a3b8;margin-top:3px;}
.share-box{background:#f0f9ff;border:2px solid #0ea5e9;padding:20px;border-radius:10px;margin:20px 0;text-align:center;}
.share-box h3{font-family:Inter,sans-serif;color:#0369a1;margin-bottom:12px;}
.share-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:15px;}
.share-item{background:white;padding:12px;border-radius:8px;border:1px solid #e0f2fe;text-align:center;}
.share-role{font-family:Inter,sans-serif;font-weight:600;color:#0369a1;font-size:10pt;}
.share-why{font-size:9pt;color:#64748b;margin-top:4px;}
.next-steps{background:#faf5ff;border:2px solid #a855f7;padding:20px;border-radius:10px;margin:20px 0;text-align:center;}
.next-steps h3{font-family:Inter,sans-serif;color:#7c3aed;margin-bottom:10px;}
.next-date{font-family:Inter,sans-serif;font-size:16pt;font-weight:bold;color:#7c3aed;margin:10px 0;}
.resources{background:#f0f9ff;border:2px solid #0ea5e9;padding:20px;border-radius:10px;margin:20px 0;text-align:center;}
.resources h3{font-family:Inter,sans-serif;color:#0369a1;margin-bottom:12px;}
.res-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;}
.res-grid a{font-family:Inter,sans-serif;display:block;background:white;padding:12px;border-radius:6px;color:#2563EB;text-decoration:none;font-size:10pt;font-weight:500;border:1px solid #e0f2fe;}
.disclaimer{background:#f5f5f5;padding:12px 15px;border-radius:8px;font-size:9pt;color:#666;margin:20px 0;text-align:center;}
.guidance-note{background:#fffbeb;border:1px solid #fbbf24;padding:10px 14px;border-radius:6px;font-size:9pt;color:#92400e;margin:15px auto;max-width:700px;text-align:center;}
.footer{text-align:center;margin-top:30px;padding-top:20px;border-top:2px solid #2563EB;color:#888;font-size:9pt;}

/* Mobile Responsive Styles */
@media screen and (max-width: 768px) {
  body{padding:15px;font-size:10pt;line-height:1.6;}
  .download-bar{flex-direction:column;gap:10px;text-align:center;margin:-15px -15px 20px -15px;padding:12px;}
  .download-bar button{width:100%;padding:12px;}
  .header{margin-bottom:20px;padding-bottom:15px;}
  .logo{font-size:24px;}
  .guidance-note{padding:10px;font-size:8pt;margin:10px auto;}
  .score-section{grid-template-columns:1fr;gap:15px;}
  .score-box{padding:20px;}
  .score-number{font-size:32pt;}
  .score-label{font-size:10pt;}
  .score-comparison{padding:15px;}
  .category-grid{grid-template-columns:repeat(3,1fr);gap:8px;}
  .category-item{padding:10px 5px;}
  .category-score{font-size:16pt;}
  .category-name{font-size:8pt;}
  .summary-table{gap:10px;}
  .summary-item{padding:12px 15px;min-width:90px;}
  .summary-item .num{font-size:20pt;}
  .summary-item .label{font-size:8pt;}
  .cost-analysis{padding:15px;}
  .cost-grid{grid-template-columns:1fr;gap:12px;}
  .cost-amount{font-size:20pt;}
  h2{font-size:14pt;margin:20px 0 10px;}
  h3{font-size:12pt;}
  .priority-box{padding:14px;margin:10px auto;}
  .priority-box h4{font-size:11pt;}
  .priority-box p{font-size:9pt;}
  .issue-card{padding:15px;margin:15px 0;}
  .issue-header{flex-direction:column;gap:8px;}
  .issue-title{font-size:12pt;}
  .issue-details{grid-template-columns:1fr;}
  .issue-details.half{grid-template-columns:1fr;}
  .detail-box{padding:12px;}
  .detail-text{font-size:9pt;}
  .good-section{padding:15px;}
  .good-grid{grid-template-columns:1fr;}
  .good-item{padding:10px;}
  .good-text{font-size:9pt;}
  .action-plan{padding:15px;}
  .action-plan h2{font-size:14pt;margin-bottom:15px;}
  .action-week{padding:15px;margin:10px 0;}
  .action-week h4{font-size:11pt;}
  .action-item{padding:8px 0;}
  .action-task{font-size:9pt;}
  .quick-ref{padding:15px;}
  .quick-ref h3{font-size:11pt;}
  .quick-ref-grid{grid-template-columns:1fr;gap:10px;}
  .quick-ref-item{padding:12px;}
  .quick-ref-value{font-size:12pt;}
  .share-box{padding:15px;}
  .share-grid{grid-template-columns:1fr 1fr;gap:8px;}
  .share-item{padding:10px;}
  .share-role{font-size:9pt;}
  .share-why{font-size:8pt;}
  .next-steps{padding:15px;}
  .next-date{font-size:14pt;}
  .resources{padding:15px;}
  .res-grid{grid-template-columns:1fr 1fr;gap:8px;}
  .res-grid a{padding:10px;font-size:9pt;}
  .resources-grid{grid-template-columns:1fr !important;gap:12px !important;}
  .disclaimer{padding:10px;font-size:8pt;}
  .footer{margin-top:20px;padding-top:15px;font-size:8pt;}
}

@media screen and (max-width: 480px) {
  body{padding:10px;}
  .category-grid{grid-template-columns:repeat(2,1fr);}
  .share-grid{grid-template-columns:1fr;}
  .res-grid{grid-template-columns:1fr;}
  .summary-table{flex-direction:column;align-items:center;}
  .summary-item{width:100%;max-width:200px;}
}

@media print{.download-bar{display:none !important;}}
</style></head><body>

<div class="download-bar">
<span>📄 Your HRShieldIQ™ Guidance Report</span>
<button onclick="window.print()">🖨️ Save as PDF / Print</button>
</div>

<div class="header">
<div class="logo">HRShield<span>IQ</span>™</div>
<p style="color:#666;">HR Compliance Guidance Report</p>
<p style="font-size:10pt;color:#888;">Prepared for: <strong>${safeBusinessName}</strong> | ${safeIndustry} | ${reportDate}</p>
</div>

<div class="guidance-note">
📋 <strong>Guidance Document:</strong> This report provides educational recommendations based on your self-assessment. It is not a compliance audit, legal opinion, or certification. Consult qualified professionals for your specific situation.
</div>

<!-- Score + Comparison -->
<div class="score-section">
  <div class="score-box">
    <div class="score-number">${score}</div>
    <div class="score-label">out of 500 points</div>
    <div class="risk-level">${r.riskLevel || 'ASSESSED'}</div>
  </div>
  <div class="score-comparison">
    <h3 style="font-family:Inter;font-size:11pt;color:#334155;margin-bottom:12px;text-align:center;">How You Compare</h3>
    <div class="comparison-item">
      <span class="comparison-label">Your Score</span>
      <span class="comparison-value">${score}</span>
    </div>
    <div class="comparison-bar"><div class="comparison-fill" style="width:${Math.min(100, score/5)}%;background:#2563EB;"></div></div>
    <div class="comparison-item" style="margin-top:12px;">
      <span class="comparison-label">${safeIndustry} Average</span>
      <span class="comparison-value">${indData.avg}</span>
    </div>
    <div class="comparison-bar"><div class="comparison-fill" style="width:${Math.min(100, indData.avg/5)}%;background:#94a3b8;"></div></div>
    <div class="comparison-item" style="margin-top:12px;">
      <span class="comparison-label">All Industries Average</span>
      <span class="comparison-value">${allAvg}</span>
    </div>
    <div class="comparison-bar"><div class="comparison-fill" style="width:${Math.min(100, allAvg/5)}%;background:#94a3b8;"></div></div>
    <p class="compare-msg ${score > indData.avg ? 'compare-good' : score > indData.avg - 30 ? 'compare-ok' : 'compare-low'}">${compareMsg}</p>
  </div>
</div>

<!-- Category Breakdown -->
<h2>Score by Category</h2>
<div class="category-grid">
  <div class="category-item ${catScores.hiring >= 70 ? 'cat-good' : catScores.hiring >= 50 ? 'cat-ok' : 'cat-bad'}">
    <div class="category-score">${catScores.hiring}</div>
    <div class="category-max">/ 100</div>
    <div class="category-name">Hiring & Onboarding</div>
  </div>
  <div class="category-item ${catScores.wage >= 70 ? 'cat-good' : catScores.wage >= 50 ? 'cat-ok' : 'cat-bad'}">
    <div class="category-score">${catScores.wage}</div>
    <div class="category-max">/ 100</div>
    <div class="category-name">Wage & Hour</div>
  </div>
  <div class="category-item ${catScores.policies >= 70 ? 'cat-good' : catScores.policies >= 50 ? 'cat-ok' : 'cat-bad'}">
    <div class="category-score">${catScores.policies}</div>
    <div class="category-max">/ 100</div>
    <div class="category-name">Policies & Training</div>
  </div>
  <div class="category-item ${catScores.documentation >= 70 ? 'cat-good' : catScores.documentation >= 50 ? 'cat-ok' : 'cat-bad'}">
    <div class="category-score">${catScores.documentation}</div>
    <div class="category-max">/ 100</div>
    <div class="category-name">Documentation</div>
  </div>
  <div class="category-item ${catScores.termination >= 70 ? 'cat-good' : catScores.termination >= 50 ? 'cat-ok' : 'cat-bad'}">
    <div class="category-score">${catScores.termination}</div>
    <div class="category-max">/ 100</div>
    <div class="category-name">Termination</div>
  </div>
</div>

<div class="summary-table">
  <div class="summary-item critical"><div class="num">${r.criticalCount || 0}</div><div class="label">Critical Issues</div></div>
  <div class="summary-item attention"><div class="num">${r.attentionCount || 0}</div><div class="label">Needs Attention</div></div>
  <div class="summary-item good"><div class="num">${r.goodCount || 0}</div><div class="label">Good Practices</div></div>
</div>

<!-- Risk Analysis -->
<div class="cost-analysis">
  <h3>💰 Potential Risk vs. Investment to Improve</h3>
  <div class="cost-grid">
    <div class="cost-box risk">
      <div class="cost-amount">${indData.exposure}</div>
      <div class="cost-label">Estimated Exposure Range</div>
      <div class="cost-detail">Based on common penalties for issues like yours</div>
    </div>
    <div class="cost-box invest">
      <div class="cost-amount">~$${fixCost.toLocaleString()}</div>
      <div class="cost-label">Estimated Cost to Address</div>
      <div class="cost-detail">Handbook updates, training, admin time</div>
    </div>
  </div>
  <p class="cost-note">Addressing these areas could significantly reduce your risk exposure</p>
</div>

<h2>Executive Summary</h2>
<p style="text-align:center;max-width:700px;margin:0 auto 15px;">${escapeHtml(r.executiveSummary || 'Assessment completed. Review the recommendations below.')}</p>

<h2>Top 3 Priorities</h2>
${prioritiesHtml}

${criticalHtml}
${attentionHtml}
${goodHtml}

<!-- Action Plan -->
<div class="action-plan">
  <h2>🎯 Recommended 30-Day Action Plan</h2>
  <div class="action-week">
    <h4>⚡ Week 1: Quick Wins</h4>
    ${week1Tasks}
  </div>
  <div class="action-week">
    <h4>🔧 Weeks 2-4: Core Improvements</h4>
    ${week2Tasks}
  </div>
  <div class="action-week">
    <h4>🔄 Ongoing Practices</h4>
    ${ongoingTasks}
  </div>
</div>

<!-- Quick Reference -->
<div class="quick-ref">
  <h3>📋 Common Compliance Timeframes</h3>
  <div class="quick-ref-grid">
    <div class="quick-ref-item">
      <div class="quick-ref-label">Form I-9 (Work Eligibility)</div>
      <div class="quick-ref-value">3 Days</div>
      <div class="quick-ref-note">From hire start date</div>
    </div>
    <div class="quick-ref-item">
      <div class="quick-ref-label">Personnel Records</div>
      <div class="quick-ref-value">3+ Years</div>
      <div class="quick-ref-note">After termination</div>
    </div>
    <div class="quick-ref-item">
      <div class="quick-ref-label">Payroll Records</div>
      <div class="quick-ref-value">3+ Years</div>
      <div class="quick-ref-note">Fair Labor Standards Act (FLSA)</div>
    </div>
  </div>
</div>

<!-- Share -->
<div class="share-box">
  <h3>📤 Consider Sharing This Report With</h3>
  <div class="share-grid">
    <div class="share-item"><div class="share-role">Employment Attorney</div><div class="share-why">Policy review</div></div>
    <div class="share-item"><div class="share-role">Insurance Agent</div><div class="share-why">EPLI (Employment Practices Liability Insurance)</div></div>
    <div class="share-item"><div class="share-role">Accountant/CPA</div><div class="share-why">Worker Classification</div></div>
    <div class="share-item"><div class="share-role">HR Consultant</div><div class="share-why">Implementation</div></div>
  </div>
</div>

<!-- Reassess -->
<div class="next-steps">
  <h3>📅 Reassess Your Progress</h3>
  <p style="font-size:10pt;color:#6b21a8;">After implementing changes, consider reassessing in:</p>
  <div class="next-date">${reassessDate}</div>
  <p style="font-size:9pt;color:#7c3aed;">Goal: Continue improving your compliance practices</p>
</div>

<!-- Resources -->
<div style="background:#eff6ff;border-radius:12px;padding:25px;margin:25px 0;">
  <h3 style="font-family:Inter,sans-serif;color:#2563EB;text-align:center;margin:0 0 8px;font-size:14pt;">📚 Free Resources</h3>
  <p style="text-align:center;color:#64748b;font-size:10pt;margin:0 0 20px;">Trusted government and nonprofit resources for small business HR compliance:</p>
  
  <div class="resources-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
    <div style="background:white;border-radius:10px;padding:18px;border:1px solid #e2e8f0;">
      <a href="https://www.dol.gov/agencies/whd" style="color:#2563EB;font-weight:600;font-size:11pt;text-decoration:none;font-family:Inter,sans-serif;">DOL Wage & Hour Division</a>
      <p style="color:#475569;font-size:9.5pt;margin:8px 0 0;line-height:1.6;">Department of Labor — federal wage laws, overtime rules, minimum wage requirements, and employer compliance assistance.</p>
    </div>
    <div style="background:white;border-radius:10px;padding:18px;border:1px solid #e2e8f0;">
      <a href="https://www.eeoc.gov/employers" style="color:#2563EB;font-weight:600;font-size:11pt;text-decoration:none;font-family:Inter,sans-serif;">EEOC Employer Resources</a>
      <p style="color:#475569;font-size:9.5pt;margin:8px 0 0;line-height:1.6;">Equal Employment Opportunity Commission — anti-discrimination laws, harassment prevention, and required workplace posters.</p>
    </div>
    <div style="background:white;border-radius:10px;padding:18px;border:1px solid #e2e8f0;">
      <a href="https://www.osha.gov/employers" style="color:#2563EB;font-weight:600;font-size:11pt;text-decoration:none;font-family:Inter,sans-serif;">OSHA Employer Resources</a>
      <p style="color:#475569;font-size:9.5pt;margin:8px 0 0;line-height:1.6;">Occupational Safety & Health Administration — workplace safety requirements, injury reporting, and free consultation programs.</p>
    </div>
    <div style="background:white;border-radius:10px;padding:18px;border:1px solid #e2e8f0;">
      <a href="https://www.uscis.gov/i-9" style="color:#2563EB;font-weight:600;font-size:11pt;text-decoration:none;font-family:Inter,sans-serif;">USCIS I-9 Central</a>
      <p style="color:#475569;font-size:9.5pt;margin:8px 0 0;line-height:1.6;">U.S. Citizenship & Immigration Services — Form I-9 instructions, acceptable documents list, and E-Verify information.</p>
    </div>
    <div style="background:white;border-radius:10px;padding:18px;border:1px solid #e2e8f0;">
      <a href="https://www.irs.gov/businesses/small-businesses-self-employed/independent-contractor-self-employed-or-employee" style="color:#2563EB;font-weight:600;font-size:11pt;text-decoration:none;font-family:Inter,sans-serif;">IRS Worker Classification</a>
      <p style="color:#475569;font-size:9.5pt;margin:8px 0 0;line-height:1.6;">Internal Revenue Service — employee vs. contractor rules, Form SS-8 determinations, and payroll tax requirements.</p>
    </div>
    <div style="background:white;border-radius:10px;padding:18px;border:1px solid #e2e8f0;">
      <a href="https://www.shrm.org/topics-tools" style="color:#2563EB;font-weight:600;font-size:11pt;text-decoration:none;font-family:Inter,sans-serif;">SHRM HR Toolkit</a>
      <p style="color:#475569;font-size:9.5pt;margin:8px 0 0;line-height:1.6;">Society for Human Resource Management — HR templates, policy samples, and best practices from the leading HR professional organization.</p>
    </div>
  </div>
</div>

<!-- Sources -->
<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px 20px;margin:20px 0;">
  <h4 style="font-family:Inter,sans-serif;font-size:10pt;color:#475569;margin:0 0 10px;text-align:center;">📖 Data Sources & References</h4>
  <p style="font-size:8pt;color:#64748b;margin:0;line-height:1.8;text-align:center;">
    Industry statistics referenced in this report are compiled from publicly available sources including:
    U.S. Department of Labor (DOL) Wage & Hour Division enforcement data •
    Occupational Safety and Health Administration (OSHA) inspection statistics •
    Equal Employment Opportunity Commission (EEOC) guidance documents •
    Society for Human Resource Management (SHRM) best practices •
    Hiscox Employment Practices Liability Report •
    National Federation of Independent Business (NFIB) surveys •
    State licensing board compliance data.
    <br/><br/>
    <strong>Industry-Specific Source:</strong> ${indData.source}
  </p>
</div>

<div class="disclaimer">
<strong>Important Disclaimer:</strong> This HRShieldIQ™ report provides educational guidance based on your self-reported answers about general HR practices. This is NOT a compliance audit, legal opinion, HR certification, or guarantee of compliance with any federal, state, or local law. Employment law is complex and varies by jurisdiction. <strong>Always consult qualified employment attorneys and HR professionals</strong> before making decisions about your specific HR practices. TechShield KC LLC assumes no liability for actions taken based on this guidance.
</div>

<div class="footer">
<p><strong>TechShield KC LLC</strong></p>
<p>hrshieldiq.com | info@techshieldkc.com | Kansas City, MO</p>
<p style="margin-top:8px;">© ${new Date().getFullYear()} HRShieldIQ™ — Educational Guidance Tool</p>
</div>

</body></html>`;

      reportWindow.document.write(htmlContent);
      reportWindow.document.close();
    };

    return (
      <div style={baseStyles}>
        <style>{globalStyles}</style>
        <div style={{ maxWidth: '500px', margin: '0 auto', textAlign: 'center', paddingTop: '3rem' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', fontSize: '2.5rem', color: 'white' }}>✓</div>
          
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem', color: colors.white }}>Your Report is Ready!</h1>
          <p style={{ color: colors.grayLight, fontSize: '1rem', marginBottom: '0.5rem' }}>{businessInfo.name}</p>

          {report && typeof report.score === 'number' && (
            <div style={{ background: colors.darkCard, borderRadius: '12px', padding: '1.5rem', margin: '1.5rem 0' }}>
              <div style={{ fontSize: '3rem', fontWeight: 700, color: colors.primary }}>{report.score}</div>
              <div style={{ color: colors.gray, fontSize: '0.9rem' }}>out of 500</div>
              <p style={{ color: colors.gray, fontSize: '0.75rem', margin: '0.5rem 0' }}>Typical small organizations score between 250–350</p>
              <div style={{ display: 'inline-block', background: report.riskLevel === 'HIGH RISK' ? '#dc2626' : report.riskLevel === 'ELEVATED RISK' ? '#f59e0b' : report.riskLevel === 'MODERATE' ? '#3b82f6' : '#10b981', color: 'white', padding: '0.4rem 1rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600, marginTop: '0.5rem' }}>{report.riskLevel}{report.riskLevel === 'HIGH RISK' ? ' — immediate attention recommended' : ''}</div>
              <div style={{ color: colors.gray, fontSize: '0.75rem', marginTop: '1rem', paddingTop: '0.75rem', borderTop: `1px solid ${colors.grayDark}33` }}>25 questions × 20 points = 500 max. Higher is better.</div>
            </div>
          )}
          
          {/* Summary Stats */}
          {report && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              <div style={{ background: '#fee2e2', borderRadius: '10px', padding: '1rem 1.5rem', textAlign: 'center', minWidth: '100px' }}>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#dc2626' }}>{report.criticalCount || 0}</div>
                <div style={{ fontSize: '0.75rem', color: '#991b1b' }}>Critical Issues</div>
              </div>
              <div style={{ background: '#fef3c7', borderRadius: '10px', padding: '1rem 1.5rem', textAlign: 'center', minWidth: '100px' }}>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f59e0b' }}>{report.attentionCount || 0}</div>
                <div style={{ fontSize: '0.75rem', color: '#92400e' }}>Needs Attention</div>
              </div>
              <div style={{ background: '#d1fae5', borderRadius: '10px', padding: '1rem 1.5rem', textAlign: 'center', minWidth: '100px' }}>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#10b981' }}>{report.goodCount || 0}</div>
                <div style={{ fontSize: '0.75rem', color: '#065f46' }}>Good Practices</div>
              </div>
            </div>
          )}
          
          <button data-download-pdf="true" onClick={downloadPdf} style={{ background: colors.primary, border: 'none', borderRadius: '10px', padding: '1rem 2.5rem', color: colors.white, cursor: 'pointer', fontFamily: 'inherit', fontSize: '1.1rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.75rem', boxShadow: `0 4px 20px ${colors.primary}40`, marginBottom: '2rem' }}>
            📄 Download PDF Report
          </button>
          
          <div style={{ background: colors.primaryLight, border: `1px solid ${colors.primaryBorder}`, borderRadius: '10px', padding: '1.25rem', marginBottom: '1.5rem' }}>
            <p style={{ fontWeight: 600, color: colors.white, marginBottom: '0.5rem', fontSize: '0.9rem' }}>Need help implementing recommendations?</p>
            <p style={{ color: colors.grayLight, fontSize: '0.8rem', marginBottom: '0.75rem' }}>TechShield KC offers hands-on HR compliance support for small businesses.</p>
            <a href="mailto:info@techshieldkc.com?subject=HRShieldIQ%20Follow-up" style={{ color: colors.primary, fontSize: '0.85rem', textDecoration: 'none', fontWeight: 500 }}>Contact us →</a>
          </div>
          
          <button onClick={() => { setCurrentStep('intro'); setCurrentCategory(0); setAnswers({}); setReport(null); setShowPaywall(false); setPaymentComplete(false); }} style={{ background: 'transparent', border: `1px solid ${colors.grayDark}`, borderRadius: '8px', padding: '0.75rem 1.25rem', color: colors.grayLight, cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.85rem' }}>
            Start New Assessment
          </button>
          
          <div style={{ borderTop: `1px solid ${colors.grayDark}33`, paddingTop: '1.5rem', marginTop: '2rem' }}>
            <p style={{ fontSize: '0.7rem', color: colors.grayDark, lineHeight: 1.6 }}>This is an educational assessment, not an HR audit or compliance certification.</p>
            <p style={{ fontSize: '0.75rem', color: colors.gray, marginTop: '0.75rem' }}>© {new Date().getFullYear()} HRShieldIQ™ by TechShield KC LLC</p>
            <p style={{ fontSize: '0.7rem', marginTop: '0.5rem' }}>
              <a href="/privacy.html" style={{ color: colors.grayDark, textDecoration: 'none', marginRight: '1rem' }}>Privacy Policy</a>
              <a href="/terms.html" style={{ color: colors.grayDark, textDecoration: 'none' }}>Terms of Service</a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default HRShieldIQ;
