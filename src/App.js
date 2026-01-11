import React, { useState, useEffect, useRef } from 'react';

const HRShieldIQ = () => {
  const [currentStep, setCurrentStep] = useState('intro');
  const [currentCategory, setCurrentCategory] = useState(0);
  const [answers, setAnswers] = useState({});
  const [businessInfo, setBusinessInfo] = useState({ name: '', industry: '', size: '', state: '', email: '' });
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoError, setPromoError] = useState('');
  const [activeTab, setActiveTab] = useState('business');
  const paypalRef = useRef(null);

  // Valid promo codes
  const validPromoCodes = ['FAMILYFREE', 'TECHSHIELD2026', 'VIPACCESS', 'HRCHECK50', 'KCBIZ50'];

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

  // Simple markdown to HTML converter
  const markdownToHtml = (markdown) => {
    if (!markdown) return '';
    
    let html = markdown
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/^### (.*$)/gm, '<h3 style="color: #ffffff; font-size: 1.1rem; margin: 1.5rem 0 0.75rem; font-weight: 600;">$1</h3>')
      .replace(/^## (.*$)/gm, '<h2 style="color: #2563EB; font-size: 1.3rem; margin: 2rem 0 1rem; font-weight: 700; border-bottom: 1px solid #333; padding-bottom: 0.5rem;">$1</h2>')
      .replace(/^# (.*$)/gm, '<h1 style="color: #ffffff; font-size: 2rem; margin: 1rem 0; font-weight: 700;">$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #ffffff;">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^---$/gm, '<hr style="border: none; border-top: 1px solid #333; margin: 1.5rem 0;">')
      .replace(/^- (.*$)/gm, '<li style="margin: 0.5rem 0; margin-left: 1.5rem;">$1</li>')
      .replace(/\|:?-+:?\|/g, '')
      .replace(/^\|(.*)\|$/gm, (match, content) => {
        const cells = content.split('|').map(cell => cell.trim());
        return '<tr>' + cells.map(cell => `<td style="padding: 0.5rem; border: 1px solid #333;">${cell}</td>`).join('') + '</tr>';
      })
      .replace(/\n\n/g, '</p><p style="margin: 1rem 0; line-height: 1.7;">')
      .replace(/\n/g, '<br>');
    
    html = '<p style="margin: 1rem 0; line-height: 1.7;">' + html + '</p>';
    html = html.replace(/<p[^>]*><\/p>/g, '');
    html = html.replace(/<p[^>]*><br><\/p>/g, '');
    
    return html;
  };

  // Scroll to top whenever step or category changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep, currentCategory]);

  const [paypalLoading, setPaypalLoading] = useState(false);
  const [paypalSdkReady, setPaypalSdkReady] = useState(false);

  // Load PayPal SDK and render button when paywall opens
  useEffect(() => {
    if (showPaywall && !paymentComplete && businessInfo.email && businessInfo.email.includes('@')) {
      if (!paypalSdkReady) {
        setPaypalLoading(true);
        
        // Remove any existing PayPal scripts
        const existingScripts = document.querySelectorAll('script[src*="paypal.com/sdk"]');
        existingScripts.forEach(s => s.remove());
        window.paypal = undefined;
        
        // Load PayPal SDK
        const script = document.createElement('script');
        const clientId = 'ATtOAGgoUaBRiQSclDhG6I7ER_KhNPgWGs3WUJYgs1fIUw4htpDW0d8NRCzehPkLxTNNBorisya_-NaK';
        script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD`;
        
        script.async = true;
        script.onload = () => {
          setPaypalSdkReady(true);
          setPaypalLoading(false);
          setTimeout(() => renderPayPalButton(), 100);
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
  }, [showPaywall, paymentComplete, businessInfo.email, paypalSdkReady]);

  // Re-render button when paywall reopens
  useEffect(() => {
    if (showPaywall && !paymentComplete && window.paypal && paypalSdkReady && !paypalLoading) {
      setTimeout(() => renderPayPalButton(), 100);
    }
  }, [showPaywall]);

  const renderPayPalButton = () => {
    if (!paypalRef.current || !window.paypal) return;
    
    paypalRef.current.innerHTML = '';
    
    window.paypal.Buttons({
      style: { 
        layout: 'vertical', 
        color: 'gold', 
        shape: 'pill', 
        label: 'paypal', 
        height: 45 
      },
      createOrder: (data, actions) => {
        return actions.order.create({
          purchase_units: [{
            description: 'HRShieldIQ™ - HR Compliance Assessment Report',
            amount: { value: '29.99' }
          }]
        });
      },
      onApprove: async (data, actions) => {
        const order = await actions.order.capture();
        console.log('Payment successful:', order);
        console.log('Customer email:', businessInfo.email);
        console.log('Business name:', businessInfo.name);
        console.log('Transaction ID:', order.id);
        setPaymentComplete(true);
        setShowPaywall(false);
        generateReport(true);
      },
      onError: (err) => {
        console.error('PayPal error:', err);
        alert('Payment failed. Please try again.');
      }
    }).render(paypalRef.current);
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
          options: ['Yes, reviewed by HR/attorney', 'Think so, but not verified', 'Not sure what\'s on it', 'We use an informal process'] 
        },
        { 
          id: 'i9_completion', 
          text: 'Do you complete Form I-9 within 3 business days of each new hire\'s start date?', 
          helper: 'Federal law requires I-9 completion within 3 days. ICE fines range from $252 to $2,507 per form for first offenses.',
          options: ['Yes, always within 3 days', 'Usually, but sometimes delayed', 'Often completed late', 'Not sure what I-9 is'] 
        },
        { 
          id: 'i9_storage', 
          text: 'Where do you store I-9 forms?', 
          helper: 'I-9s must be stored separately from personnel files. During an audit, you must produce I-9s without exposing other employee records.',
          options: ['Separate I-9 folder/binder', 'In each employee\'s personnel file', 'Digital HR system separately', 'Not sure'] 
        },
        { 
          id: 'background_checks', 
          text: 'If you run background checks, do applicants sign a separate disclosure and authorization form?', 
          helper: 'FCRA requires standalone disclosure (not buried in the application) and written consent before running any background check.',
          options: ['Yes, separate FCRA-compliant form', 'It\'s included in our application', 'We don\'t run background checks', 'Not sure'] 
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
          options: ['Yes, clearly stated', 'Mentioned but not prominent', 'No at-will statement', 'Not sure / State doesn\'t allow'] 
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
          helper: 'Misclassification is the #1 wage & hour violation. Job duties—not title or salary alone—determine exempt status under FLSA.',
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
          options: ['Yes, always calculated correctly', 'Yes, but calculation may vary', 'We offer comp time instead', 'Not sure how it\'s handled'] 
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
          helper: 'Employers must display posters about minimum wage, FMLA, OSHA, EEO, and state-specific requirements. Fines range from $100-$35,000.',
          options: ['Yes, current year posters displayed', 'Yes, but may be outdated', 'Some posters, not all', 'No posters / Not sure'] 
        },
        { 
          id: 'eeoc_records', 
          text: 'Do you retain employment records (applications, personnel files) for required periods?', 
          helper: 'EEOC requires 1 year for applications, 1 year after termination for personnel records. FLSA requires 3 years for payroll. Longer is safer.',
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
          helper: 'Exit interviews can reveal workplace issues, potential claims, and provide documentation of the employee\'s voluntary departure.',
          options: ['Yes, standard practice', 'Sometimes, inconsistently', 'Rarely or never', 'Only for certain positions'] 
        },
        { 
          id: 'cobra_notice', 
          text: 'When employees leave, do you provide required COBRA or state continuation notices?', 
          helper: 'Employers with 20+ employees must offer COBRA within 14 days of termination. Many states have mini-COBRA for smaller employers.',
          options: ['Yes, timely notices sent', 'Our insurance carrier handles it', 'We have fewer than 20 employees', 'Not sure if we comply'] 
        },
        { 
          id: 'workers_comp', 
          text: 'Do you have workers\' compensation insurance and a process for reporting injuries?', 
          helper: 'Workers\' comp is required in almost all states. Failure to carry coverage can result in criminal penalties and personal liability.',
          options: ['Yes, insurance and reporting process', 'Yes, but informal reporting', 'Not sure about our coverage', 'We\'re exempt (certain states)'] 
        },
        { 
          id: 'retaliation_awareness', 
          text: 'Do managers understand what constitutes illegal retaliation against employees?', 
          helper: 'Retaliation claims are the #1 EEOC charge. Adverse actions after complaints—even legitimate discipline—can appear retaliatory.',
          options: ['Yes, managers are trained', 'Generally understood', 'Not specifically addressed', 'Not sure'] 
        }
      ]
    }
  ];

  const currentCategoryData = categories[currentCategory];
  const totalQuestions = categories.reduce((sum, cat) => sum + cat.questions.length, 0);
  const answeredQuestions = Object.keys(answers).length;
  const allQuestionsAnswered = currentCategoryData.questions.every(q => answers[q.id]);

  // Scoring logic
  const calculateScore = () => {
    let score = 0;
    const allQuestions = categories.flatMap(cat => cat.questions);
    
    allQuestions.forEach(question => {
      const answer = answers[question.id];
      if (!answer) return;
      
      const optionIndex = question.options.indexOf(answer);
      if (optionIndex === 0) score += 20; // Best practice
      else if (optionIndex === 1) score += 12; // Partial
      else if (optionIndex === 2) score += 4; // Poor but aware
      else score += 0; // Worst or unsure
    });
    
    const iqScore = Math.round((score / 500) * 100);
    return { score, iqScore };
  };

  // Background report generation
  const [reportGenerating, setReportGenerating] = useState(false);
  const [reportReady, setReportReady] = useState(false);
  const [pendingReport, setPendingReport] = useState(null);

  const generateReport = async (isPaid = false) => {
    // If payment just completed and report is ready, show it immediately
    if ((isPaid || paymentComplete) && reportReady && pendingReport) {
      setReport(pendingReport);
      setCurrentStep('report');
      setLoading(false);
      return;
    }
    
    if (reportGenerating) {
      setLoading(true);
      return;
    }
    
    setLoading(true);
    setShowPaywall(false);
    
    await generateReportAPI(isPaid);
  };

  const generateReportAPI = async (isPaid = false) => {
    setReportGenerating(true);
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const prompt = `You are an HR compliance advisor. Analyze ALL 25 questions in this employment compliance assessment and return ONLY valid JSON.

BUSINESS: ${businessInfo.name}
INDUSTRY: ${businessInfo.industry}
SIZE: ${businessInfo.size}

THEIR ANSWERS (ALL 25 MUST BE CATEGORIZED):
${Object.entries(answers).map(([q, a]) => `${q}: ${a}`).join('\n')}

SCORING RULES:
- 25 questions × 20 points each = 500 max
- Best practice answer (first option) = 20 points
- Partial compliance (second option) = 12 points
- Poor practice (third option) = 4 points
- No compliance/unsure (fourth option) = 0 points
- Score ranges: Under 200=HIGH RISK, 200-300=ELEVATED RISK, 300-400=MODERATE, 400-500=STRONG

CATEGORIZATION RULES - EVERY QUESTION MUST GO INTO ONE CATEGORY:
- criticalIssues: Answers that scored 0-4 points (worst two options) - these are serious compliance gaps
- attentionIssues: Answers that scored 12 points (second-best option) - room for improvement
- goodPractices: Answers that scored 20 points (best option) - already compliant

INDUSTRY-SPECIFIC HR CONTEXT for ${businessInfo.industry}:
- Healthcare / Medical: HIPAA training requirements, credential verification, background check regulations, on-call pay rules, mandatory overtime limits in some states.
- Religious Organization: Ministerial exception for certain roles, religious discrimination nuances, volunteer vs. employee classification, parsonage considerations.
- Daycare / Childcare: Mandatory background checks, child abuse reporting training, staff-to-child ratios create scheduling complexity, high turnover.
- Retail / Restaurant: Tip credit calculations, minor work permits, predictive scheduling laws, split shift premiums, high turnover documentation.
- Construction / Trades: Davis-Bacon Act for federal projects, prevailing wage, apprenticeship regulations, safety training documentation, subcontractor vs. employee.
- Professional Services: Exempt classification scrutiny, non-compete enforceability varies by state, client confidentiality in separation.
- Manufacturing: OSHA recordkeeping, union considerations, shift differential calculations, temporary worker joint employment.
- Nonprofit: Volunteer vs. employee classification, grant-funded position compliance, board member employment issues.

Return this JSON structure with COMPLETE analysis of ALL 25 questions:
{
  "score": [calculated number 0-500 based on scoring rules above],
  "riskLevel": "[HIGH RISK/ELEVATED RISK/MODERATE/STRONG based on score]",
  "criticalCount": [count of criticalIssues array],
  "attentionCount": [count of attentionIssues array],
  "goodCount": [count of goodPractices array - these three counts MUST equal 25],
  "executiveSummary": "[4-5 sentences: Acknowledge what they're doing well, identify the key compliance gaps, mention industry-specific risks for ${businessInfo.industry}, give overall assessment and most urgent action]",
  "priorities": [
    {"title": "[Most urgent specific action]", "reason": "[Why this matters - include penalty amount or lawsuit statistic]"},
    {"title": "[Second priority action]", "reason": "[Consequence if not addressed]"},
    {"title": "[Third priority action]", "reason": "[Business impact]"}
  ],
  "criticalIssues": [
    {
      "topic": "[Specific compliance area from their poor answer]",
      "answer": "[Quote their exact answer choice]",
      "risk": "[2-3 sentences: Specific penalties (dollar amounts), lawsuit exposure, regulatory consequences for ${businessInfo.industry}]",
      "fix": "[Detailed steps: exactly what to do, what forms/documents needed, who should own this task, resources to use]",
      "effort": "[Realistic time estimate: 1 hour, 2-3 hours, half-day, ongoing, etc.]"
    }
  ],
  "attentionIssues": [
    {
      "topic": "[Compliance area needing improvement]",
      "answer": "[Their answer]",
      "risk": "[1-2 sentences on the specific risk or exposure]",
      "fix": "[Specific improvement steps with actionable detail]",
      "effort": "[Time estimate]"
    }
  ],
  "goodPractices": [
    {"practice": "[What they're doing well - be specific]", "benefit": "[Why this matters - protection provided]"}
  ],
  "actionPlan": {
    "week1": ["[Specific quick win from critical issues]", "[Another immediate action]", "[Third quick win]", "[Fourth if applicable]", "[Fifth if applicable]"],
    "week2to4": ["[Larger implementation from attention items]", "[Second task]", "[Third task]", "[Fourth task]", "[Fifth task]", "[Sixth task]", "[Seventh task]", "[Eighth task]"],
    "ongoing": ["[Monthly maintenance task]", "[Quarterly review task]", "[Annual compliance task]", "[Another ongoing task]", "[Fifth ongoing]", "[Sixth ongoing]"]
  }
}

CRITICAL REQUIREMENTS:
- Return ONLY valid JSON, no markdown code blocks
- ALL 25 questions must be categorized - criticalCount + attentionCount + goodCount MUST equal 25
- Be specific to ${businessInfo.industry} industry throughout
- Reference their actual answer text in quotes
- Include specific dollar amounts for penalties and fines where relevant
- goodPractices must be an array of objects with "practice" and "benefit" fields
- Generate comprehensive action plan items (5+ per section)`;

    try {
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
        const { score } = calculateScore();
        reportData = {
          score: score,
          riskLevel: score < 200 ? 'HIGH RISK' : score < 300 ? 'ELEVATED RISK' : score < 400 ? 'MODERATE' : 'STRONG',
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
      
      if (isPaid || paymentComplete) {
        setReport(reportData);
        setCurrentStep('report');
      } else {
        setPendingReport(reportData);
        setReportReady(true);
      }
    } catch (error) {
      console.error('Error:', error);
      const { score } = calculateScore();
      const fallbackReport = {
        score: score,
        riskLevel: score < 200 ? 'HIGH RISK' : score < 300 ? 'ELEVATED RISK' : score < 400 ? 'MODERATE' : 'STRONG',
        criticalCount: 3,
        attentionCount: 5,
        goodCount: 17,
        executiveSummary: 'Assessment completed. Please review the details below.',
        priorities: [
          { title: 'Review I-9 compliance', reason: 'ICE fines are significant' },
          { title: 'Update handbook', reason: 'Employment law changes frequently' },
          { title: 'Document performance issues', reason: 'Protects against wrongful termination claims' }
        ],
        criticalIssues: [],
        attentionIssues: [],
        goodPractices: [],
        actionPlan: { week1: ['Review report'], week2to4: ['Implement changes'], ongoing: ['Annual review'] }
      };
      
      if (isPaid || paymentComplete) {
        setReport(fallbackReport);
        setCurrentStep('report');
      } else {
        setPendingReport(fallbackReport);
        setReportReady(true);
      }
    } finally {
      setLoading(false);
      setReportGenerating(false);
    }
  };

  // Base styles
  const baseStyles = {
    minHeight: '100vh',
    background: colors.darkBg,
    color: colors.white,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    padding: '2rem 1rem'
  };

  const globalStyles = `
    * { box-sizing: border-box; }
    body { margin: 0; background: ${colors.darkBg}; }
    ::selection { background: ${colors.primary}; color: white; }
    input, select, button { font-family: inherit; }
  `;

  // INTRO SCREEN - Landing Page v2
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
        
        {/* Gradient */}
        <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse at 50% 0%, rgba(37,99,235,0.08) 0%, transparent 60%)', pointerEvents: 'none', zIndex: 0 }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          
          {/* Hero */}
          <section style={{ padding: '60px 24px 48px', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
            
            <h1 style={{ fontSize: 'clamp(2.5rem, 12vw, 3.5rem)', fontWeight: 700, marginBottom: '16px', letterSpacing: '-0.02em' }}>
              <span style={{ color: '#fff' }}>HRShield</span>
              <span style={{ color: colors.primary }}>IQ</span>
              <span style={{ color: colors.primary, fontSize: '0.5em', verticalAlign: 'super' }}>™</span>
            </h1>

            <p style={{ fontSize: '1.2rem', color: '#999', marginBottom: '8px' }}>
              Before you spend $10,000 on an HR audit,
            </p>
            <p style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '28px' }}>
              spend <span style={{ color: colors.primary, fontWeight: 600 }}>7 minutes</span> finding out what you actually need.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '16px', marginBottom: '8px', fontSize: '1rem', color: '#666' }}>
              <span>✓ 7 min</span>
              <span>✓ 25 questions</span>
              <span>✓ DOL & EEOC</span>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#444', marginBottom: '28px' }}>
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

            <button onClick={() => setCurrentStep('business')} style={{ display: 'inline-block', backgroundColor: colors.primary, color: '#fff', padding: '18px 40px', fontSize: '1.15rem', fontWeight: 600, borderRadius: '8px', border: 'none', cursor: 'pointer', boxShadow: '0 4px 20px rgba(37,99,235,0.3)', fontFamily: 'inherit' }}>
              Start Free Assessment →
            </button>
            <p style={{ fontSize: '1rem', color: '#555', marginTop: '16px' }}>
              Free score preview • Full report: <span style={{ color: colors.primary }}>$29.99</span>
            </p>
          </section>

          {/* Problem */}
          <section style={{ padding: '48px 24px', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#fff', marginBottom: '24px' }}>
              The problem with "experts"
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' }}>
              {[
                '💰 HR consultants charge $150-300/hour',
                '⚖️ Attorneys bill for questions you could answer',
                '📋 You don\'t know what you don\'t know'
              ].map((item, i) => (
                <div key={i} style={{ backgroundColor: '#141414', borderRadius: '8px', padding: '16px 20px', fontSize: '1.1rem', color: '#999', border: '1px solid #1a1a1a', textAlign: 'center' }}>
                  {item}
                </div>
              ))}
            </div>

            <p style={{ fontSize: '1.2rem', color: '#fff' }}>
              What if you knew <span style={{ color: colors.primary }}>where you stand</span> first?
            </p>
          </section>

          {/* Credibility - MOVED HERE after Problem */}
          <section style={{ padding: '48px 24px', backgroundColor: '#0f0f0f' }}>
            <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#fff', marginBottom: '24px' }}>
                Built on real standards
              </h2>
              
              <div style={{ backgroundColor: '#141414', borderRadius: '12px', padding: '24px', border: '1px solid #252525', marginBottom: '16px' }}>
                <p style={{ fontSize: '1.05rem', color: '#ccc', lineHeight: 1.7, margin: 0 }}>
                  Built on <span style={{ color: colors.primary, fontWeight: 600 }}>DOL guidelines</span>, <span style={{ color: colors.primary, fontWeight: 600 }}>EEOC requirements</span>, and <span style={{ color: colors.primary, fontWeight: 600 }}>SHRM best practices</span>—the same standards employment attorneys and HR professionals use.
                </p>
              </div>
              
              <div style={{ backgroundColor: '#141414', borderRadius: '12px', padding: '24px', border: '1px solid #252525' }}>
                <p style={{ fontSize: '1.05rem', color: '#ccc', lineHeight: 1.7, margin: 0 }}>
                  Built by an <span style={{ color: '#fff', fontWeight: 500 }}>IT Director who spent 20 years managing HR compliance</span> across 150+ locations. Vetted by a <span style={{ color: '#fff', fontWeight: 500 }}>healthcare HR executive</span> who's lived this stuff.
                </p>
              </div>
            </div>
          </section>

          {/* Features - NO background */}
          <section style={{ padding: '48px 24px' }}>
            <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#fff', marginBottom: '28px' }}>
                Your report includes
              </h2>

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
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#fff', marginBottom: '24px' }}>
              Sample report preview
            </h2>

            <div style={{ backgroundColor: '#141414', borderRadius: '12px', padding: '24px', border: '1px solid #252525' }}>
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '2.5rem', fontWeight: 700, color: colors.primary }}>
                  324<span style={{ fontSize: '1rem', color: '#666' }}>/500</span>
                </div>
                <span style={{ backgroundColor: 'rgba(37,99,235,0.2)', color: colors.primary, padding: '4px 12px', borderRadius: '4px', fontSize: '0.9rem', fontWeight: 600 }}>ELEVATED RISK</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginBottom: '20px', fontSize: '1rem' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#e74c3c' }}>4</div>
                  <div style={{ color: '#666', fontSize: '0.85rem' }}>Critical</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f39c12' }}>6</div>
                  <div style={{ color: '#666', fontSize: '0.85rem' }}>Attention</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#27ae60' }}>15</div>
                  <div style={{ color: '#666', fontSize: '0.85rem' }}>Good</div>
                </div>
              </div>

              <div style={{ backgroundColor: '#1a1a1a', borderRadius: '8px', padding: '16px', marginBottom: '16px', textAlign: 'left' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ color: '#e74c3c', fontWeight: 600, fontSize: '1rem' }}>🔴 I-9s Stored in Personnel Files</span>
                  <span style={{ backgroundColor: '#e74c3c', color: '#fff', padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>CRITICAL</span>
                </div>
                <p style={{ color: '#888', fontSize: '0.95rem', margin: 0 }}>
                  Fix: Create separate I-9 folder. <span style={{ color: colors.primary }}>⏱️ 1-2 hours</span>
                </p>
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

            <a href="/sample-report.html" target="_blank" style={{ display: 'inline-block', color: colors.primary, marginTop: '20px', fontSize: '1rem', textDecoration: 'none' }}>
              View full sample →
            </a>
          </section>

          {/* Price Comparison */}
          <section style={{ padding: '48px 24px', backgroundColor: '#0f0f0f' }}>
            <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#fff', marginBottom: '28px' }}>
                The math
              </h2>

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
                  <p style={{ color: '#888', fontSize: '0.85rem', margin: 0 }}>7 minutes</p>
                </div>
              </div>
            </div>
          </section>

          {/* What It Is */}
          <section style={{ padding: '48px 24px', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#fff', marginBottom: '24px' }}>
              What this is
            </h2>
            
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

          {/* FAQ - WITH background, centered text */}
          <section style={{ padding: '48px 24px', backgroundColor: '#0f0f0f' }}>
            <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#fff', marginBottom: '24px' }}>
                FAQ
              </h2>

              {[
                { q: 'Will this make me compliant?', a: 'No. It shows where you stand so you can decide what to do.' },
                { q: "I'm not an HR expert. Will I understand?", a: 'Yes. Plain English, yes/no questions, no jargon.' },
                { q: 'Replacement for an attorney?', a: "It's what you do before calling one." },
                { q: 'How long does it take?', a: '7 minutes. Report generates instantly.' }
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
            <h2 style={{ fontSize: '1.6rem', fontWeight: 600, color: '#fff', marginBottom: '16px', lineHeight: 1.4 }}>
              You'll find out where you stand eventually.
            </h2>
            <p style={{ fontSize: '1.1rem', color: '#888', marginBottom: '32px', lineHeight: 1.6 }}>
              On <strong style={{ color: '#fff' }}>your terms</strong>, or when the DOL comes knocking.
            </p>

            <button onClick={() => setCurrentStep('business')} style={{ display: 'inline-block', backgroundColor: colors.primary, color: '#fff', padding: '18px 40px', fontSize: '1.15rem', fontWeight: 600, borderRadius: '8px', border: 'none', cursor: 'pointer', boxShadow: '0 4px 24px rgba(37,99,235,0.35)', fontFamily: 'inherit' }}>
              Start Free Assessment →
            </button>
            
            <p style={{ fontSize: '1rem', color: '#555', marginTop: '16px' }}>
              Free preview • Full report: <span style={{ color: colors.primary, fontWeight: 600 }}>$29.99</span> • 7 min
            </p>
          </section>

          {/* Disclaimer */}
          <div style={{ padding: '20px 24px', backgroundColor: 'rgba(37,99,235,0.05)', borderTop: '1px solid rgba(37,99,235,0.1)', textAlign: 'center' }}>
            <p style={{ maxWidth: '600px', margin: '0 auto', fontSize: '0.9rem', color: '#555' }}>
              <span style={{ color: colors.primary }}>📋</span> Educational guidance only. Not a compliance certification or legal advice.
            </p>
          </div>

          {/* Footer */}
          <footer style={{ padding: '32px 24px', textAlign: 'center', borderTop: '1px solid #1a1a1a' }}>
            <p style={{ fontSize: '1rem', marginBottom: '8px' }}>
              <span style={{ color: '#fff' }}>TechShield</span> <span style={{ color: colors.primary }}>KC LLC</span>
            </p>
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
      <div style={baseStyles}>
        <style>{globalStyles}</style>
        
        <div style={{ maxWidth: '500px', margin: '0 auto' }}>
          {/* Header with Back and Time */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <button
              onClick={() => setCurrentStep('intro')}
              style={{
                background: 'none',
                border: 'none',
                color: colors.grayLight,
                cursor: 'pointer',
                fontSize: '0.95rem',
                padding: 0,
                fontFamily: 'inherit'
              }}
            >
              ← Back
            </button>
            <span style={{ color: colors.gray, fontSize: '0.9rem' }}>
              ⏱️ About 7 minutes
            </span>
          </div>
          
          {/* Main Heading */}
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.75rem', color: colors.white }}>
            Personalize your report
          </h1>
          <p style={{ color: colors.gray, fontSize: '1rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
            We'll customize your report with <span style={{ color: colors.white, fontWeight: 500 }}>industry specific risks</span> and benchmarks.
          </p>
          
          {/* Score Explanation Box */}
          <div style={{
            background: colors.darkCard,
            border: `1px solid ${colors.grayDark}44`,
            borderRadius: '10px',
            padding: '1rem 1.25rem',
            marginBottom: '2rem'
          }}>
            <p style={{ color: colors.gray, fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
              <span style={{ color: colors.primary, fontWeight: 600 }}>HRShieldIQ™ Score:</span> 25 questions × 20 points each = <span style={{ color: colors.white, fontWeight: 600 }}>500 max</span>. Higher is better. Your score reflects HR compliance readiness based on DOL & EEOC guidelines.
            </p>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Organization Name */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.95rem' }}>
                Organization Name <span style={{ color: colors.primary }}>*</span>
              </label>
              <input
                type="text"
                placeholder="Your Business Name"
                value={businessInfo.name}
                onChange={e => setBusinessInfo(prev => ({ ...prev, name: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '1rem 1.25rem',
                  background: colors.darkCard,
                  border: `1px solid ${colors.grayDark}44`,
                  borderRadius: '8px',
                  color: colors.white,
                  fontSize: '1rem'
                }}
              />
            </div>
            
            {/* Industry */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500, fontSize: '0.95rem' }}>
                Industry <span style={{ color: colors.primary }}>*</span>
              </label>
              <p style={{ color: colors.grayDark, fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                This customizes your report with relevant compliance risks
              </p>
              <select
                value={businessInfo.industry}
                onChange={e => setBusinessInfo(prev => ({ ...prev, industry: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '1rem 1.25rem',
                  background: colors.darkCard,
                  border: `1px solid ${colors.grayDark}44`,
                  borderRadius: '8px',
                  color: businessInfo.industry ? colors.white : colors.gray,
                  fontSize: '1rem'
                }}
              >
                <option value="">Select your industry...</option>
                <option value="Construction / Trades">Construction / Trades</option>
                <option value="Daycare / Childcare">Daycare / Childcare</option>
                <option value="Education / School">Education / School</option>
                <option value="Financial Services">Financial Services</option>
                <option value="Healthcare / Medical">Healthcare / Medical</option>
                <option value="Hospitality / Restaurant">Hospitality / Restaurant</option>
                <option value="Manufacturing">Manufacturing</option>
                <option value="Nonprofit / Association">Nonprofit / Association</option>
                <option value="Professional Services">Professional Services (Legal, Accounting, Consulting)</option>
                <option value="Real Estate">Real Estate</option>
                <option value="Religious Organization">Religious Organization</option>
                <option value="Retail / E-commerce">Retail / E-commerce</option>
                <option value="Technology / IT">Technology / IT</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            {/* Organization Size */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.95rem' }}>
                Organization Size <span style={{ color: colors.primary }}>*</span>
              </label>
              <select
                value={businessInfo.size}
                onChange={e => setBusinessInfo(prev => ({ ...prev, size: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '1rem 1.25rem',
                  background: colors.darkCard,
                  border: `1px solid ${colors.grayDark}44`,
                  borderRadius: '8px',
                  color: businessInfo.size ? colors.white : colors.gray,
                  fontSize: '1rem'
                }}
              >
                <option value="">Select size...</option>
                <option value="1-4 employees">1-4 employees</option>
                <option value="5-14 employees">5-14 employees</option>
                <option value="15-49 employees">15-49 employees (ADA/Title VII threshold)</option>
                <option value="50-99 employees">50-99 employees (FMLA/ACA threshold)</option>
                <option value="100+ employees">100+ employees</option>
              </select>
            </div>
          </div>
          
          {/* Submit Button */}
          <button
            onClick={() => setCurrentStep('questions')}
            disabled={!businessInfo.name.trim() || !businessInfo.industry || !businessInfo.size}
            style={{
              width: '100%',
              marginTop: '2rem',
              background: (businessInfo.name.trim() && businessInfo.industry && businessInfo.size) ? colors.primary : colors.darkCard,
              color: (businessInfo.name.trim() && businessInfo.industry && businessInfo.size) ? colors.white : colors.grayDark,
              border: 'none',
              padding: '1.1rem',
              fontSize: '1.05rem',
              fontWeight: 600,
              borderRadius: '8px',
              cursor: (businessInfo.name.trim() && businessInfo.industry && businessInfo.size) ? 'pointer' : 'not-allowed',
              fontFamily: 'inherit'
            }}
          >
            Start My Assessment →
          </button>
          
          {/* Helper text */}
          {(!businessInfo.name.trim() || !businessInfo.industry || !businessInfo.size) && (
            <p style={{ textAlign: 'center', marginTop: '0.75rem', fontSize: '0.85rem', color: colors.grayDark }}>
              Please complete all fields to continue
            </p>
          )}
          
          {/* Privacy note */}
          <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.85rem', color: colors.gray }}>
            🔒 Your info stays private. We never sell data.
          </p>
          
          {/* Questions link */}
          <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.85rem', color: colors.grayDark }}>
            Questions? <a href="mailto:info@techshieldkc.com" style={{ color: colors.primary, textDecoration: 'none' }}>info@techshieldkc.com</a>
          </p>
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
              <span style={{ color: colors.gray, fontSize: '0.85rem' }}>
                {currentCategoryData.icon} {currentCategoryData.title}
              </span>
              <span style={{ color: colors.gray, fontSize: '0.85rem' }}>
                {answeredQuestions}/{totalQuestions}
              </span>
            </div>
            <div style={{ height: '3px', background: colors.darkCard, borderRadius: '100px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${(answeredQuestions / totalQuestions) * 100}%`,
                background: colors.primary,
                borderRadius: '100px',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>

          {/* Reassurance */}
          <div style={{
            background: colors.darkCard,
            border: `1px solid ${colors.grayDark}22`,
            borderRadius: '8px',
            padding: '0.875rem 1rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem'
          }}>
            <span style={{ fontSize: '1rem', flexShrink: 0 }}>💡</span>
            <p style={{ fontSize: '0.85rem', color: colors.gray, lineHeight: 1.5, margin: 0 }}>
              <strong style={{ color: colors.grayLight }}>Answer as best you can.</strong> If you're unsure, select "Not sure" — we'll flag it as an area to investigate.
            </p>
          </div>
          
          {/* Category Tabs */}
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            marginBottom: '1.5rem',
            overflowX: 'auto',
            paddingBottom: '0.5rem'
          }}>
            {categories.map((cat, i) => {
              const catAnswered = cat.questions.filter(q => answers[q.id]).length;
              const catComplete = catAnswered === cat.questions.length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setCurrentCategory(i)}
                  style={{
                    background: currentCategory === i ? colors.primaryLight : colors.darkCard,
                    border: `1px solid ${currentCategory === i ? colors.primaryBorder : 'transparent'}`,
                    borderRadius: '100px',
                    padding: '0.4rem 0.9rem',
                    color: currentCategory === i ? colors.primary : colors.gray,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  {cat.icon} {cat.title}
                  {catComplete && <span style={{ color: '#22c55e' }}>✓</span>}
                </button>
              );
            })}
          </div>
          
          {/* Questions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {currentCategoryData.questions.map((question, qIndex) => (
              <div
                key={question.id}
                style={{
                  background: colors.darkCard,
                  border: `1px solid ${colors.grayDark}22`,
                  borderRadius: '12px',
                  padding: '1.25rem'
                }}
              >
                <p style={{ marginBottom: '0.5rem', fontWeight: 500, lineHeight: 1.5, fontSize: '0.95rem' }}>
                  {qIndex + 1}. {question.text}
                </p>
                
                {question.helper && (
                  <p style={{ fontSize: '0.8rem', color: colors.gray, marginBottom: '1rem', lineHeight: 1.5, paddingLeft: '0.5rem', borderLeft: `2px solid ${colors.grayDark}44` }}>
                    {question.helper}
                  </p>
                )}
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {question.options.map((option, optIndex) => {
                    const isSelected = answers[question.id] === option;
                    return (
                      <button
                        key={optIndex}
                        onClick={() => setAnswers(prev => ({ ...prev, [question.id]: option }))}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '0.75rem 1rem',
                          background: isSelected ? colors.primaryLight : 'transparent',
                          border: `1px solid ${isSelected ? colors.primary : colors.grayDark}44`,
                          borderRadius: '8px',
                          color: isSelected ? colors.white : colors.grayLight,
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          fontSize: '0.9rem',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <span style={{
                          display: 'inline-block',
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          border: `2px solid ${isSelected ? colors.primary : colors.grayDark}`,
                          marginRight: '0.75rem',
                          verticalAlign: 'middle',
                          background: isSelected ? colors.primary : 'transparent',
                          position: 'relative'
                        }}>
                          {isSelected && (
                            <span style={{
                              position: 'absolute',
                              top: '50%',
                              left: '50%',
                              transform: 'translate(-50%, -50%)',
                              color: colors.white,
                              fontSize: '10px'
                            }}>✓</span>
                          )}
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
            <button
              onClick={() => currentCategory > 0 ? setCurrentCategory(currentCategory - 1) : setCurrentStep('business')}
              style={{
                background: 'transparent',
                border: `1px solid ${colors.grayDark}`,
                borderRadius: '8px',
                padding: '0.75rem 1.5rem',
                color: colors.grayLight,
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: '0.9rem'
              }}
            >
              ← Back
            </button>
            
            {currentCategory < categories.length - 1 ? (
              <button
                onClick={() => setCurrentCategory(currentCategory + 1)}
                disabled={!allQuestionsAnswered}
                style={{
                  background: allQuestionsAnswered ? colors.primary : colors.darkCard,
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.75rem 1.5rem',
                  color: allQuestionsAnswered ? colors.white : colors.grayDark,
                  cursor: allQuestionsAnswered ? 'pointer' : 'not-allowed',
                  fontFamily: 'inherit',
                  fontSize: '0.9rem',
                  fontWeight: 600
                }}
              >
                {allQuestionsAnswered ? 'Next Category →' : `Answer all ${currentCategoryData.questions.length} questions`}
              </button>
            ) : (
              <button
                onClick={() => {
                  generateReportAPI();
                  setCurrentStep('preview');
                }}
                disabled={answeredQuestions < totalQuestions}
                style={{
                  background: answeredQuestions >= totalQuestions ? colors.primary : colors.darkCard,
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.75rem 1.5rem',
                  color: answeredQuestions >= totalQuestions ? colors.white : colors.grayDark,
                  cursor: answeredQuestions >= totalQuestions ? 'pointer' : 'not-allowed',
                  fontFamily: 'inherit',
                  fontSize: '0.9rem',
                  fontWeight: 600
                }}
              >
                {answeredQuestions >= totalQuestions ? 'See My Results →' : `Answer all questions (${answeredQuestions}/${totalQuestions})`}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // PREVIEW SCREEN - Assessment Complete with blurred score
  if (currentStep === 'preview') {
    // Calculate estimates from answers
    const calculateEstimates = () => {
      let critical = 0;
      let attention = 0;
      let good = 0;
      
      Object.values(answers).forEach(answer => {
        const lower = answer.toLowerCase();
        if (lower.includes('no') || lower.includes('never') || lower.includes('not sure') || lower.includes('none') || lower.includes("don't") || lower.includes('varies')) {
          critical++;
        } else if (lower.includes('some') || lower.includes('partial') || lower.includes('occasionally') || lower.includes('informal') || lower.includes('think so') || lower.includes('usually')) {
          attention++;
        } else {
          good++;
        }
      });
      
      return { critical, attention, good };
    };
    
    const estimates = calculateEstimates();
    const displayData = pendingReport ? {
      critical: pendingReport.criticalCount || 0,
      attention: pendingReport.attentionCount || 0,
      good: pendingReport.goodCount || 0
    } : estimates;

    return (
      <div style={baseStyles}>
        <style>{globalStyles}</style>
        
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem 1rem' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: colors.primary, marginBottom: '0.5rem' }}>
              Assessment Complete!
            </h1>
            <p style={{ color: colors.gray, fontSize: '0.9rem' }}>{businessInfo.name}</p>
          </div>

          {/* Locked Score Card */}
          <div style={{
            background: colors.darkCard,
            borderRadius: '16px',
            padding: '2rem',
            textAlign: 'center',
            marginBottom: '1.5rem',
            border: `2px solid ${colors.primary}`,
            position: 'relative'
          }}>
            <div style={{ fontSize: '4rem', fontWeight: 700, color: colors.primary, filter: 'blur(8px)' }}>
              {pendingReport?.score || 324}
            </div>
            <div style={{ color: colors.gray, fontSize: '1rem', marginBottom: '1rem', filter: 'blur(4px)' }}>out of 500</div>
            <div style={{
              display: 'inline-block',
              background: '#f59e0b',
              color: 'white',
              padding: '0.5rem 1.5rem',
              borderRadius: '20px',
              fontSize: '0.9rem',
              fontWeight: 600,
              filter: 'blur(4px)'
            }}>
              {pendingReport?.riskLevel || 'CALCULATING'}
            </div>
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'rgba(0,0,0,0.8)',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              border: `1px solid ${colors.primary}`
            }}>
              <span style={{ fontSize: '1.5rem' }}>🔒</span>
              <span style={{ color: colors.white, marginLeft: '0.5rem', fontWeight: 600 }}>Unlock Your Score</span>
            </div>
          </div>

          {/* Stats - visible */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '1rem',
            marginBottom: '1.5rem',
            flexWrap: 'wrap'
          }}>
            <div style={{
              background: '#fee2e2',
              padding: '1rem 1.5rem',
              borderRadius: '10px',
              textAlign: 'center',
              minWidth: '100px'
            }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#dc2626' }}>{displayData.critical}</div>
              <div style={{ fontSize: '0.75rem', color: '#991b1b' }}>Critical</div>
            </div>
            <div style={{
              background: '#fef3c7',
              padding: '1rem 1.5rem',
              borderRadius: '10px',
              textAlign: 'center',
              minWidth: '100px'
            }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f59e0b' }}>{displayData.attention}</div>
              <div style={{ fontSize: '0.75rem', color: '#92400e' }}>Attention</div>
            </div>
            <div style={{
              background: '#d1fae5',
              padding: '1rem 1.5rem',
              borderRadius: '10px',
              textAlign: 'center',
              minWidth: '100px'
            }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#10b981' }}>{displayData.good}</div>
              <div style={{ fontSize: '0.75rem', color: '#065f46' }}>Good</div>
            </div>
          </div>

          {/* Sample Report Preview - BLURRED */}
          <div style={{
            background: colors.darkCard,
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '1.5rem'
          }}>
            <h3 style={{ color: colors.white, fontSize: '1rem', marginBottom: '1rem' }}>
              📋 Sample from your report:
            </h3>
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
          <div style={{
            background: colors.primaryLight,
            border: `1px solid ${colors.primaryBorder}`,
            borderRadius: '12px',
            padding: '1.25rem',
            marginBottom: '1.5rem',
            textAlign: 'center'
          }}>
            <p style={{ fontWeight: 600, color: colors.white, marginBottom: '0.75rem', fontSize: '0.95rem' }}>
              Your personalized report includes:
            </p>
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
          <button
            onClick={() => setShowPaywall(true)}
            style={{
              width: '100%',
              background: colors.primary,
              border: 'none',
              borderRadius: '10px',
              padding: '1rem',
              color: colors.white,
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: '1.1rem',
              fontWeight: 600,
              boxShadow: `0 4px 20px ${colors.primary}40`,
              marginBottom: '1rem'
            }}
          >
            🔓 Unlock Full Report - $29.99
          </button>

          <p style={{ textAlign: 'center', color: colors.grayDark, fontSize: '0.75rem' }}>
            One-time purchase • Instant access • PDF download included
          </p>
          
          {/* Footer */}
          <div style={{ textAlign: 'center', marginTop: '2rem', paddingTop: '1rem', borderTop: `1px solid ${colors.grayDark}33` }}>
            <p style={{ fontSize: '0.7rem', color: colors.grayDark }}>
              <a href="/privacy.html" style={{ color: colors.grayDark, textDecoration: 'none', marginRight: '1rem' }}>Privacy Policy</a>
              <a href="/terms.html" style={{ color: colors.grayDark, textDecoration: 'none' }}>Terms of Service</a>
            </p>
          </div>
        </div>

        {/* Paywall Modal */}
        {showPaywall && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            zIndex: 1000,
            overflowY: 'auto'
          }}>
            <div style={{
              background: colors.darkBg,
              border: `1px solid ${colors.grayDark}44`,
              borderRadius: '16px',
              padding: '1.5rem',
              maxWidth: '420px',
              width: '100%',
              position: 'relative',
              margin: '1rem 0'
            }}>
              <button
                onClick={() => setShowPaywall(false)}
                style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  background: 'transparent',
                  border: 'none',
                  color: colors.gray,
                  cursor: 'pointer',
                  fontSize: '1.5rem',
                  lineHeight: 1
                }}
              >
                ×
              </button>

              {/* Score + Title */}
              <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                  Your Results Are Ready
                </h3>
                
                {reportReady && pendingReport && (
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    background: colors.darkCard,
                    border: `2px solid ${colors.primary}`,
                    borderRadius: '8px',
                    padding: '0.5rem 1rem'
                  }}>
                    <span style={{ fontSize: '1.25rem', fontWeight: 700, color: colors.primary }}>{pendingReport.score}</span>
                    <span style={{ color: colors.gray }}>/500</span>
                    <span style={{ 
                      color: pendingReport.riskLevel === 'HIGH RISK' ? '#ef4444' : 
                             pendingReport.riskLevel === 'ELEVATED RISK' ? '#eab308' : '#22c55e', 
                      fontWeight: 600, 
                      fontSize: '0.8rem' 
                    }}>• {pendingReport.riskLevel}</span>
                    <span style={{ color: colors.gray, fontSize: '0.75rem' }}>({pendingReport.criticalCount} critical)</span>
                  </div>
                )}
              </div>
              
              {/* What's Included */}
              <div style={{ 
                fontSize: '0.75rem', 
                color: colors.grayLight, 
                marginBottom: '1rem',
                lineHeight: 1.6
              }}>
                {[
                  'HRShieldIQ™ score with risk level',
                  'All 25 areas analyzed individually',
                  'Your answer + why it matters + what to do',
                  'Industry-specific compliance context',
                  '30-day action roadmap'
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ color: colors.primary }}>✓</span> {item}
                  </div>
                ))}
              </div>

              {/* Plan Selection */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.75rem', color: colors.gray, marginBottom: '0.5rem', textAlign: 'center' }}>
                  Choose your plan:
                </div>
                
                <div style={{
                  background: colors.primaryLight,
                  border: `2px solid ${colors.primary}`,
                  borderRadius: '8px',
                  padding: '0.75rem',
                  marginBottom: '0.4rem',
                  cursor: 'pointer'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <div style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        border: `2px solid ${colors.primary}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: colors.primary }} />
                      </div>
                      <div style={{ fontWeight: 600, color: colors.white, fontSize: '0.9rem' }}>Full Report</div>
                    </div>
                    <div style={{ fontWeight: 700, color: colors.primary, fontSize: '1rem' }}>$29.99</div>
                  </div>
                </div>
              </div>

              {/* Email */}
              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.35rem', 
                  fontSize: '0.8rem',
                  color: colors.grayLight
                }}>
                  Email address <span style={{ color: colors.primary }}>*</span>
                </label>
                <input
                  type="email"
                  value={businessInfo.email}
                  onChange={e => setBusinessInfo(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="you@company.com"
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.75rem',
                    background: colors.darkCard,
                    border: `1px solid ${colors.grayDark}44`,
                    borderRadius: '6px',
                    color: colors.white,
                    fontSize: '0.95rem',
                    outline: 'none'
                  }}
                  onFocus={e => e.target.style.borderColor = colors.primary}
                  onBlur={e => e.target.style.borderColor = `${colors.grayDark}44`}
                />
              </div>

              {/* Promo Code */}
              <div style={{ marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="text"
                    value={promoCode}
                    onChange={e => { setPromoCode(e.target.value.toUpperCase()); setPromoError(''); }}
                    placeholder="Promo code (optional)"
                    style={{
                      flex: 1,
                      padding: '0.6rem 0.75rem',
                      background: colors.darkCard,
                      border: `1px solid ${colors.grayDark}44`,
                      borderRadius: '6px',
                      color: colors.white,
                      fontSize: '0.85rem',
                      outline: 'none'
                    }}
                  />
                  <button
                    onClick={() => {
                      if (validPromoCodes.includes(promoCode)) {
                        setPaymentComplete(true);
                        setShowPaywall(false);
                        generateReport(true);
                      } else {
                        setPromoError('Invalid code');
                      }
                    }}
                    style={{
                      background: colors.primary,
                      border: 'none',
                      borderRadius: '6px',
                      padding: '0.6rem 1rem',
                      color: colors.white,
                      cursor: 'pointer',
                      fontWeight: 500,
                      fontSize: '0.85rem'
                    }}
                  >
                    Apply
                  </button>
                </div>
                {promoError && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>{promoError}</p>}
              </div>
              
              {/* PayPal */}
              {businessInfo.email && businessInfo.email.includes('@') ? (
                <div>
                  {paypalLoading && (
                    <div style={{ textAlign: 'center', padding: '0.75rem', color: colors.gray, fontSize: '0.85rem' }}>
                      Loading payment options...
                    </div>
                  )}
                  <div ref={paypalRef} style={{ minHeight: paypalLoading ? '0' : '45px' }}></div>
                </div>
              ) : (
                <p style={{ textAlign: 'center', color: colors.primary, fontSize: '0.8rem' }}>
                  ↑ Enter email to continue
                </p>
              )}
              
              {/* Help */}
              <p style={{ textAlign: 'center', fontSize: '0.75rem', color: colors.grayDark, marginTop: '1rem' }}>
                Questions? info@techshieldkc.com
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // LOADING SCREEN
  if (loading) {
    return (
      <div style={baseStyles}>
        <style>{globalStyles}</style>
        <div style={{ maxWidth: '400px', margin: '0 auto', textAlign: 'center', paddingTop: '4rem' }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: `3px solid ${colors.darkCard}`,
            borderTopColor: colors.primary,
            borderRadius: '50%',
            margin: '0 auto 1.5rem',
            animation: 'spin 1s linear infinite'
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Analyzing Your HR Compliance...</h2>
          <p style={{ color: colors.gray, fontSize: '0.9rem' }}>Building your personalized report</p>
        </div>
      </div>
    );
  }

  // REPORT SCREEN
  if (currentStep === 'report' && report) {
    const downloadPdf = () => {
      const reportWindow = window.open('', '_blank');
      if (!reportWindow) return;
      
      const r = report;
      
      // Priorities section
      const prioritiesHtml = (r.priorities || []).map((p, i) => 
        `<div class="priority-box">
          <h4>${i+1}. ${p.title}</h4>
          <p>${p.reason}</p>
        </div>`
      ).join('');
      
      // Critical issues section  
      const criticalHtml = (r.criticalIssues || []).length > 0 ? 
        '<h2>🔴 Critical Issues</h2>' + r.criticalIssues.map(issue => 
          `<div class="issue-card critical">
            <div class="issue-header">
              <span class="issue-title">${issue.topic}</span>
              <span class="badge critical">CRITICAL</span>
            </div>
            <div class="issue-answer">"${issue.answer}"</div>
            <div class="issue-content">
              <p><strong>Risk:</strong> ${issue.risk}</p>
              <p><strong>Fix:</strong> ${issue.fix}</p>
              <p><strong>Effort:</strong> ⏱️ ${issue.effort}</p>
            </div>
          </div>`
        ).join('') : '';
      
      // Attention issues section
      const attentionHtml = (r.attentionIssues || []).length > 0 ?
        '<h2>🟡 Items Needing Attention</h2>' + r.attentionIssues.map(issue =>
          `<div class="issue-card attention">
            <div class="issue-header">
              <span class="issue-title">${issue.topic}</span>
              <span class="badge attention">NEEDS ATTENTION</span>
            </div>
            <div class="issue-answer">"${issue.answer}"</div>
            <div class="issue-content">
              <p><strong>Risk:</strong> ${issue.risk}</p>
              <p><strong>Fix:</strong> ${issue.fix}</p>
              <p><strong>Effort:</strong> ⏱️ ${issue.effort}</p>
            </div>
          </div>`
        ).join('') : '';
      
      // Good practices section - handle both old (string) and new (object) formats
      const goodHtml = (r.goodPractices || []).length > 0 ?
        `<div class="good-section">
          <h3>✅ What You're Doing Well</h3>
          <div class="good-list">
            ${r.goodPractices.map(p => {
              if (typeof p === 'string') {
                return `<div class="good-item"><span class="check">✓</span><span class="good-text">${p}</span></div>`;
              } else {
                return `<div class="good-item"><span class="check">✓</span><span class="good-text">${p.practice}</span><span class="good-benefit">${p.benefit}</span></div>`;
              }
            }).join('')}
          </div>
        </div>` : '';
      
      // Action plan lists
      const week1 = (r.actionPlan?.week1 || []).map(t => `<li>${t}</li>`).join('');
      const week2 = (r.actionPlan?.week2to4 || []).map(t => `<li>${t}</li>`).join('');
      const ongoing = (r.actionPlan?.ongoing || []).map(t => `<li>${t}</li>`).join('');
      
      const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>HRShieldIQ Report - ${businessInfo.name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Segoe UI, Arial, sans-serif; max-width: 850px; margin: 0 auto; padding: 40px; background: #fff; color: #333; line-height: 1.6; font-size: 11pt; }
    .download-bar { background: #2563EB; color: white; padding: 15px 20px; margin: -40px -40px 30px -40px; display: flex; justify-content: space-between; align-items: center; }
    .download-bar button { background: white; color: #2563EB; border: none; padding: 10px 25px; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 14px; }
    .header { text-align: center; margin-bottom: 30px; padding-bottom: 25px; border-bottom: 3px solid #2563EB; }
    .logo { font-size: 32px; font-weight: bold; margin-bottom: 5px; }
    .logo span { color: #2563EB; }
    .header p { color: #666; margin: 5px 0; }
    .header .meta { font-size: 10pt; color: #888; }
    h2 { color: #333; font-size: 16pt; margin: 30px 0 15px; padding-bottom: 8px; border-bottom: 2px solid #2563EB; }
    .score-box { background: #eff6ff; border: 3px solid #2563EB; padding: 30px; border-radius: 12px; text-align: center; margin: 25px 0; }
    .score-number { font-size: 48pt; font-weight: bold; color: #2563EB; }
    .score-label { font-size: 14pt; color: #666; margin-top: 5px; }
    .score-calc { font-size: 10pt; color: #888; margin-top: 10px; }
    .risk-level { display: inline-block; background: #f59e0b; color: white; padding: 8px 20px; border-radius: 20px; font-weight: 600; margin-top: 15px; }
    .summary-table { display: flex; justify-content: center; gap: 30px; margin: 20px 0; flex-wrap: wrap; }
    .summary-item { text-align: center; padding: 15px 25px; border-radius: 8px; min-width: 120px; }
    .summary-item.critical { background: #fee2e2; }
    .summary-item.attention { background: #fef3c7; }
    .summary-item.good { background: #d1fae5; }
    .summary-item .num { font-size: 28pt; font-weight: bold; }
    .summary-item.critical .num { color: #dc2626; }
    .summary-item.attention .num { color: #f59e0b; }
    .summary-item.good .num { color: #10b981; }
    .summary-item .label { font-size: 10pt; color: #666; }
    .fraud-stat { background: #fee2e2; border: 2px solid #dc2626; border-radius: 12px; padding: 20px; margin: 25px 0; }
    .fraud-stat h3 { color: #991b1b; margin: 0 0 12px; font-size: 13pt; text-align: center; }
    .fraud-stat-content { background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #dc2626; }
    .fraud-stat-content p { margin: 0 0 8px; color: #991b1b; font-weight: 600; font-size: 12pt; }
    .fraud-stat-content .source { margin: 0; font-size: 9pt; color: #666; font-style: italic; }
    .priority-box { background: #eff6ff; border-left: 4px solid #2563EB; padding: 20px; margin: 15px 0; border-radius: 0 8px 8px 0; }
    .priority-box h4 { color: #2563EB; margin-bottom: 8px; }
    .issue-card { background: #fafafa; border: 1px solid #e5e5e5; border-radius: 8px; padding: 20px; margin: 15px 0; }
    .issue-card.critical { border-left: 4px solid #dc2626; }
    .issue-card.attention { border-left: 4px solid #f59e0b; }
    .issue-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 10px; }
    .issue-title { font-weight: 600; color: #333; }
    .badge { padding: 4px 12px; border-radius: 12px; font-size: 9pt; font-weight: 600; }
    .badge.critical { background: #fee2e2; color: #dc2626; }
    .badge.attention { background: #fef3c7; color: #b45309; }
    .issue-answer { background: #f5f5f5; padding: 10px 15px; border-radius: 6px; font-style: italic; color: #666; margin: 10px 0; }
    .issue-content p { margin: 8px 0; }
    .good-section { background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 2px solid #10b981; border-radius: 12px; padding: 20px 25px; margin: 20px 0; }
    .good-section h3 { color: #10b981; margin-bottom: 15px; font-size: 14pt; text-align: center; }
    .good-list { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 20px; }
    .good-item { display: flex; align-items: center; gap: 8px; background: white; border: 1px solid #10b981; border-radius: 8px; padding: 10px 14px; }
    .good-item .check { color: #10b981; font-weight: bold; font-size: 14pt; }
    .good-text { font-size: 11pt; color: #166534; font-weight: 500; }
    .action-plan { background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border: 2px solid #2563EB; padding: 25px; border-radius: 12px; margin: 25px 0; }
    .action-plan h2 { color: #2563EB; border: none; margin: 0 0 15px; font-size: 16pt; text-align: center; }
    .action-week { background: white; border-radius: 8px; padding: 15px 20px; margin: 12px 0; box-shadow: 0 2px 6px rgba(0,0,0,0.05); }
    .action-week h3 { color: #2563EB; font-size: 13pt; margin: 0 0 12px; padding-bottom: 8px; border-bottom: 1px solid #bfdbfe; }
    .action-week ul { margin: 0; padding-left: 20px; }
    .action-week li { margin: 8px 0; color: #333; font-size: 11pt; }
    .share-box { background: #f0f9ff; border: 2px solid #0ea5e9; padding: 20px 25px; border-radius: 8px; margin: 20px 0; text-align: center; }
    .share-box h3 { color: #0369a1; margin-bottom: 15px; font-size: 14pt; }
    .share-list { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 25px; text-align: left; max-width: 650px; margin: 0 auto; }
    .share-item { font-size: 11pt; color: #333; }
    .consult-box { background: #eff6ff; border: 2px solid #2563EB; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
    .consult-box h3 { color: #2563EB; margin-bottom: 8px; font-size: 14pt; }
    .consult-box p { font-size: 11pt; color: #555; margin: 8px 0; }
    .consult-box a { color: #2563EB; text-decoration: none; font-size: 14pt; font-weight: 600; }
    .resources { background: #f0f9ff; border: 2px solid #0ea5e9; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
    .resources h3 { color: #0369a1; margin-bottom: 12px; font-size: 14pt; }
    .res-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
    .res-grid a { display: block; background: white; padding: 12px 10px; border-radius: 6px; color: #2563EB; text-decoration: none; font-size: 10pt; font-weight: 500; text-align: center; border: 1px solid #e0f2fe; }
    .disclaimer { background: #f5f5f5; padding: 12px 15px; border-radius: 8px; font-size: 9pt; color: #666; margin: 20px 0; text-align: center; }
    .footer { text-align: center; margin-top: 25px; padding-top: 15px; border-top: 2px solid #2563EB; color: #888; font-size: 9pt; }
    .footer strong { color: #2563EB; }
    @media print { .download-bar { display: none !important; } }
  </style>
</head>
<body>

<div class="download-bar">
  <span>📄 Your HRShieldIQ™ Report</span>
  <button onclick="window.print()">🖨️ Save as PDF / Print</button>
</div>

<div class="header">
  <div class="logo">HRShield<span>IQ</span>™</div>
  <p>Employment Compliance Assessment</p>
  <p class="meta">Prepared for: <strong>${businessInfo.name}</strong> | ${businessInfo.industry} | ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
</div>

<div class="score-box">
  <div class="score-number">${r.score || 0}</div>
  <div class="score-label">out of 500 points</div>
  <div class="score-calc">25 questions × 20 points = 500 max</div>
  <div class="risk-level" style="background:${r.riskLevel==='HIGH RISK'?'#dc2626':r.riskLevel==='ELEVATED RISK'?'#f59e0b':r.riskLevel==='MODERATE'?'#3b82f6':'#10b981'}">${r.riskLevel || 'ASSESSED'}</div>
</div>

<div class="summary-table">
  <div class="summary-item critical">
    <div class="num">${r.criticalCount || 0}</div>
    <div class="label">Critical Issues</div>
  </div>
  <div class="summary-item attention">
    <div class="num">${r.attentionCount || 0}</div>
    <div class="label">Needs Attention</div>
  </div>
  <div class="summary-item good">
    <div class="num">${r.goodCount || 0}</div>
    <div class="label">Good Practices</div>
  </div>
</div>

<div class="fraud-stat">
  <h3>⚠️ ${businessInfo.industry} Industry Risk</h3>
  <div class="fraud-stat-content">
    <p>Employment lawsuits have increased 400% over the past 20 years. The EEOC recovered over $700 million for discrimination victims in 2024 alone.</p>
    <p class="source">Source: EEOC Annual Performance Report 2024</p>
  </div>
</div>

<h2>Executive Summary</h2>
<p>${r.executiveSummary || 'Assessment completed. See details below.'}</p>

<h2>Top 3 Priorities</h2>
${prioritiesHtml}

${criticalHtml}

${attentionHtml}

${goodHtml}

<div class="action-plan">
  <h2>🎯 Your 30-Day Action Plan</h2>
  
  <div class="action-week">
    <h3>⚡ Week 1: Quick Wins</h3>
    <ul>${week1 || '<li>Review critical issues above</li>'}</ul>
  </div>
  
  <div class="action-week">
    <h3>🔧 Week 2-4: Core Improvements</h3>
    <ul>${week2 || '<li>Address attention items</li>'}</ul>
  </div>
  
  <div class="action-week">
    <h3>🔄 Ongoing</h3>
    <ul>${ongoing || '<li>Annual compliance review</li>'}</ul>
  </div>
</div>

<div class="share-box">
  <h3>📤 Who to Share This Report With</h3>
  <div class="share-list">
    <div class="share-item"><strong>Employment Attorney</strong> - Handbook & policy review</div>
    <div class="share-item"><strong>Insurance Agent</strong> - EPLI coverage discussion</div>
    <div class="share-item"><strong>Accountant/CPA</strong> - Classification & wage issues</div>
    <div class="share-item"><strong>Office Manager</strong> - Day-to-day implementation</div>
  </div>
</div>

<div class="consult-box">
  <h3>Need Help Implementing These Recommendations?</h3>
  <p>TechShield KC can assist with consultations and HR compliance support.</p>
  <p><a href="https://www.techshieldkc.com">www.techshieldkc.com</a></p>
  <p>info@techshieldkc.com | Kansas City, MO</p>
</div>

<div class="resources">
  <h3>📚 Free Resources</h3>
  <div class="res-grid">
    <a href="https://dol.gov/agencies/whd">DOL Wage & Hour</a>
    <a href="https://eeoc.gov/employers">EEOC Employers</a>
    <a href="https://shrm.org">SHRM Resources</a>
    <a href="https://uscis.gov/i-9">I-9 Central</a>
  </div>
</div>

<div class="disclaimer">
  <strong>Important:</strong> This HRShieldIQ™ assessment is educational guidance based on self-reported answers. It is not an HR audit, legal advice, or compliance certification.
</div>

<div class="footer">
  <p><strong>TechShield KC LLC</strong></p>
  <p>hrshieldiq.com | info@techshieldkc.com</p>
  <p>© ${new Date().getFullYear()} HRShieldIQ™</p>
</div>

</body>
</html>`;

      reportWindow.document.write(htmlContent);
      reportWindow.document.close();
    };
    
    return (
      <div style={baseStyles}>
        <style>{globalStyles}</style>
        
        <div style={{ maxWidth: '500px', margin: '0 auto', textAlign: 'center', paddingTop: '3rem' }}>
          {/* Success Icon */}
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: '#22c55e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
            fontSize: '2.5rem',
            color: 'white'
          }}>✓</div>
          
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem', color: colors.white }}>
            Your Report is Ready!
          </h1>
          
          <p style={{ color: colors.grayLight, fontSize: '1rem', marginBottom: '0.5rem' }}>{businessInfo.name}</p>

          {/* Score Preview */}
          {report && report.score && (
            <div style={{ background: colors.darkCard, borderRadius: '12px', padding: '1.5rem', margin: '1.5rem 0' }}>
              <div style={{ fontSize: '3rem', fontWeight: 700, color: colors.primary }}>{report.score}</div>
              <div style={{ color: colors.gray, fontSize: '0.9rem' }}>out of 500</div>
              <div style={{
                display: 'inline-block',
                background: report.riskLevel === 'HIGH RISK' ? '#dc2626' :
                           report.riskLevel === 'ELEVATED RISK' ? '#f59e0b' :
                           report.riskLevel === 'MODERATE' ? '#3b82f6' : '#10b981',
                color: 'white',
                padding: '0.4rem 1rem',
                borderRadius: '20px',
                fontSize: '0.85rem',
                fontWeight: 600,
                marginTop: '0.75rem'
              }}>{report.riskLevel}</div>
            </div>
          )}
          
          {/* Download Button */}
          <button
            onClick={downloadPdf}
            style={{
              background: colors.primary,
              border: 'none',
              borderRadius: '10px',
              padding: '1rem 2.5rem',
              color: colors.white,
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: '1.1rem',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.75rem',
              boxShadow: `0 4px 20px ${colors.primary}40`,
              marginBottom: '2rem'
            }}
          >📄 Download PDF Report</button>
          
          {/* Help Banner */}
          <div style={{
            background: colors.primaryLight,
            border: `1px solid ${colors.primaryBorder}`,
            borderRadius: '10px',
            padding: '1.25rem',
            marginBottom: '1.5rem'
          }}>
            <p style={{ fontWeight: 600, color: colors.white, marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              Need help implementing recommendations?
            </p>
            <p style={{ color: colors.grayLight, fontSize: '0.8rem', marginBottom: '0.75rem' }}>
              TechShield KC offers hands-on HR compliance support for small businesses.
            </p>
            <p style={{ color: colors.primary, fontSize: '0.85rem', fontWeight: 500 }}>
              info@techshieldkc.com
            </p>
          </div>
          
          {/* New Assessment */}
          <button
            onClick={() => {
              setCurrentStep('intro');
              setCurrentCategory(0);
              setAnswers({});
              setReport(null);
              setShowPaywall(false);
              setPaymentComplete(false);
            }}
            style={{
              background: 'transparent',
              border: `1px solid ${colors.grayDark}`,
              borderRadius: '8px',
              padding: '0.75rem 1.25rem',
              color: colors.grayLight,
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: '0.85rem'
            }}
          >Start New Assessment</button>
          
          {/* Footer */}
          <div style={{ borderTop: `1px solid ${colors.grayDark}33`, paddingTop: '1.5rem', marginTop: '2rem' }}>
            <p style={{ fontSize: '0.7rem', color: colors.grayDark, lineHeight: 1.6 }}>
              This is an educational assessment, not an HR audit or legal advice.
            </p>
            <p style={{ fontSize: '0.75rem', color: colors.gray, marginTop: '0.75rem' }}>
              © {new Date().getFullYear()} HRShieldIQ™ by TechShield KC LLC
            </p>
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
