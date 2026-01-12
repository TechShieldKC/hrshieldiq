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
  const paypalRef = useRef(null);

  const validPromoCodes = ['FAMILYFREE', 'TECHSHIELD2026', 'VIPACCESS', 'HRPRO50', 'KCBIZ50', 'COMPLIANCE2026'];

  const colors = {
    blue: '#2563EB',
    blueLight: 'rgba(37, 99, 235, 0.15)',
    blueBorder: 'rgba(37, 99, 235, 0.4)',
    black: '#1a1a1a',
    darkBg: '#0d0d0d',
    darkCard: '#161616',
    darkCardHover: '#1f1f1f',
    white: '#ffffff',
    gray: '#a3a3a3',
    grayLight: '#d4d4d4',
    grayDark: '#525252'
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep, currentCategory]);

  const [paypalLoading, setPaypalLoading] = useState(false);
  const [paypalSdkType, setPaypalSdkType] = useState(null);
  const neededSdkType = selectedPlan === 'onetime' ? 'onetime' : 'subscription';

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
  }, [selectedPlan]);

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
            purchase_units: [{ description: 'HRShieldIQ™ - HR Compliance Assessment Report', amount: { value: '19.99' } }]
          });
        },
        onApprove: async (data, actions) => {
          const order = await actions.order.capture();
          console.log('Payment successful:', order);
          setPaymentComplete(true);
          setShowPaywall(false);
          generateReport();
        },
        onError: (err) => { console.error('PayPal error:', err); alert('Payment failed. Please try again.'); }
      }).render(paypalRef.current);
    } else {
      window.paypal.Buttons({
        style: { shape: 'pill', color: 'gold', layout: 'vertical', label: 'subscribe', height: 45 },
        createSubscription: (data, actions) => { return actions.subscription.create({ plan_id: subscriptionPlanIds[selectedPlan] }); },
        onApprove: (data, actions) => {
          console.log('Subscription successful!', data.subscriptionID);
          setPaymentComplete(true);
          setShowPaywall(false);
          generateReport();
        },
        onError: (err) => { console.error('PayPal subscription error:', err); alert('Subscription failed. Please try again.'); }
      }).render(paypalRef.current);
    }
  };

  const categories = [
    {
      id: 'documentation', title: 'Employee Documentation', icon: '📋',
      questions: [
        { id: 'personnel_files', text: 'Do you maintain complete personnel files for all employees?', helper: 'Personnel files should include offer letters, tax forms (W-4, I-9), emergency contacts, signed policies, and performance reviews.', options: ['Yes, complete and organized', 'Partially - some documents missing', 'No formal personnel files', 'Not sure'] },
        { id: 'i9_compliance', text: 'Are all I-9 forms completed within 3 business days of hire?', helper: 'I-9 verification is federally required. ICE penalties can reach $2,507 per violation for first offenses, up to $25,076 for repeat violations.', options: ['Yes, always on time', 'Usually, but sometimes late', 'No formal process', 'Not sure what I-9 is'] },
        { id: 'records_retention', text: 'Do you have a document retention policy for HR records?', helper: 'Federal law requires keeping I-9s for 3 years after hire. Tax records 4 years. EEOC records 1 year.', options: ['Yes, documented policy', 'Informal guidelines', 'No - we keep everything forever', 'Not sure'] },
        { id: 'digital_storage', text: 'How do you store sensitive employee documents?', helper: 'Employee SSNs, medical info, and background checks need secure storage with limited access.', options: ['Secure system with access controls', 'Basic digital storage', 'Paper files only', 'Not sure'] },
        { id: 'job_descriptions', text: 'Do you have written job descriptions for all positions?', helper: 'Job descriptions protect against discrimination claims by documenting essential functions.', options: ['Yes, all positions documented', 'Some positions only', 'No written job descriptions', 'Not sure'] }
      ]
    },
    {
      id: 'hiring', title: 'Hiring & Onboarding', icon: '📖',
      questions: [
        { id: 'interview_consistency', text: 'Do you use consistent interview questions for candidates applying to the same role?', helper: 'Inconsistent interviews create discrimination liability.', options: ['Yes, standardized questions', 'Somewhat consistent', 'No - varies by interviewer', 'Not sure'] },
        { id: 'background_checks', text: 'Do you conduct background checks and follow FCRA requirements?', helper: 'FCRA requires specific disclosures and consent before running checks.', options: ['Yes, full FCRA compliance', 'We run checks but unsure of FCRA', 'No background checks', 'Not sure'] },
        { id: 'offer_letters', text: 'Do all new hires receive written offer letters outlining compensation and at-will status?', helper: 'Offer letters prevent misunderstandings about pay and employment terms.', options: ['Yes, always', 'Sometimes', 'Verbal offers only', 'Not sure'] },
        { id: 'onboarding_process', text: 'Do you have a documented onboarding checklist?', helper: 'Onboarding should include tax forms, benefits enrollment, policy acknowledgments, safety training.', options: ['Yes, comprehensive checklist', 'Basic informal process', 'No standard process', 'Not sure'] },
        { id: 'eeo_compliance', text: 'Do your job postings and hiring practices comply with EEO requirements?', helper: 'EEO laws prohibit discrimination based on race, color, religion, sex, national origin, age, disability.', options: ['Yes, reviewed for compliance', 'We try but haven\'t verified', 'Not sure what EEO requires', 'Not applicable (too small)'] }
      ]
    },
    {
      id: 'policies', title: 'Policies & Handbooks', icon: '💰',
      questions: [
        { id: 'employee_handbook', text: 'Do you have a current employee handbook?', helper: 'Handbooks communicate expectations and protect against wrongful termination claims.', options: ['Yes, updated within past year', 'Yes, but outdated', 'No handbook', 'Not sure'] },
        { id: 'handbook_acknowledgment', text: 'Do employees sign acknowledgment of receiving the handbook?', helper: 'Signed acknowledgments prove employees received policies - critical for enforcement.', options: ['Yes, all employees', 'Some employees', 'No acknowledgments', 'Not sure'] },
        { id: 'harassment_policy', text: 'Do you have an anti-harassment/discrimination policy with reporting procedures?', helper: 'A clear policy with multiple reporting channels is your first defense against claims.', options: ['Yes, comprehensive policy', 'Basic policy exists', 'No formal policy', 'Not sure'] },
        { id: 'leave_policies', text: 'Are your leave policies (FMLA, sick, PTO) documented and compliant?', helper: 'FMLA applies at 50+ employees. Many states have additional requirements.', options: ['Yes, legally reviewed', 'Documented but not reviewed', 'No written policies', 'Not sure what\'s required'] },
        { id: 'wage_hour_compliance', text: 'Are employees correctly classified as exempt vs. non-exempt?', helper: 'Misclassification is the #1 wage-and-hour violation. Penalties include 2-3 years back pay.', options: ['Yes, all verified', 'Mostly confident', 'Not sure about some roles', 'Not sure what this means'] }
      ]
    },
    {
      id: 'training', title: 'Compliance & Training', icon: '📁',
      questions: [
        { id: 'harassment_training', text: 'Do you provide harassment prevention training?', helper: 'CA, NY, IL, CT, DE, ME require harassment training. Even where not required, it reduces liability.', options: ['Yes, regular training', 'Once during onboarding', 'No formal training', 'Not sure if required'] },
        { id: 'manager_training', text: 'Have managers been trained on employment law basics?', helper: 'Managers often create liability through improper questions, retaliation, or inconsistent discipline.', options: ['Yes, comprehensive training', 'Some informal guidance', 'No manager training', 'Not sure'] },
        { id: 'safety_training', text: 'Do you provide required safety training for your industry?', helper: 'OSHA requires safety training in most workplaces.', options: ['Yes, documented training', 'Some training provided', 'No formal safety training', 'Not sure what\'s required'] },
        { id: 'training_documentation', text: 'Do you document all completed training with dates and signatures?', helper: 'Training only counts legally if you can prove it happened.', options: ['Yes, all documented', 'Some documentation', 'No records kept', 'Not sure'] },
        { id: 'poster_compliance', text: 'Are all required employment law posters displayed?', helper: 'Federal, state, and local laws require specific posters. Fines can exceed $35,000.', options: ['Yes, all current', 'Some may be outdated', 'Not sure what\'s required', 'We\'re fully remote'] }
      ]
    },
    {
      id: 'termination', title: 'Termination & Offboarding', icon: '🚪',
      questions: [
        { id: 'progressive_discipline', text: 'Do you follow a consistent progressive discipline process?', helper: 'Progressive discipline creates documentation showing termination wasn\'t arbitrary.', options: ['Yes, documented process', 'Informal but consistent', 'No standard process', 'Not sure'] },
        { id: 'termination_documentation', text: 'Do you document reasons for every termination?', helper: 'Documentation is your defense against wrongful termination claims.', options: ['Yes, always documented', 'Usually', 'Rarely or never', 'Not sure'] },
        { id: 'final_pay', text: 'Do you know your state\'s final paycheck requirements?', helper: 'Some states require final pay immediately. CA penalties can reach 30 days wages.', options: ['Yes, we comply', 'Think we\'re compliant', 'Not sure of requirements', 'Not applicable'] },
        { id: 'exit_process', text: 'Do you have a documented offboarding checklist?', helper: 'Offboarding should include final pay, COBRA info, property return, access revocation.', options: ['Yes, comprehensive checklist', 'Basic process', 'No formal process', 'Not sure'] },
        { id: 'unemployment_response', text: 'Do you respond to unemployment claims with documentation?', helper: 'Failing to respond increases your tax rate. Proper docs can deny claims for misconduct.', options: ['Yes, always respond', 'Sometimes respond', 'Rarely or never', 'Not sure'] }
      ]
    }
  ];

  const handleAnswer = (questionId, answer) => { setAnswers(prev => ({ ...prev, [questionId]: answer })); };

  const calculateRiskScore = () => {
    let highRisk = 0, mediumRisk = 0, iqScore = 0;
    Object.entries(answers).forEach(([key, value]) => {
      if (value.includes('No ') || value.includes('Never') || value === 'Not sure' || value.includes('Not sure what') || value.includes('No formal') || value.includes('No handbook') || value.includes('No standard') || value.includes('No written') || value.includes('No background') || value.includes('Rarely') || value.includes('Verbal offers') || value.includes('Paper files only')) {
        highRisk++; iqScore += 0;
      } else if (value.includes('Partially') || value.includes('Informal') || value.includes('Sometimes') || value.includes('Some ') || value.includes('Usually') || value.includes('Basic') || value.includes('outdated') || value.includes('Think we') || value.includes('unsure') || value.includes('Mostly')) {
        mediumRisk++; iqScore += 12;
      } else { iqScore += 20; }
    });
    return { highRisk, mediumRisk, lowRisk: Object.keys(answers).length - highRisk - mediumRisk, iqScore };
  };

  const [reportGenerating, setReportGenerating] = useState(false);
  const [reportReady, setReportReady] = useState(false);
  const [pendingReport, setPendingReport] = useState(null);

  const generateReport = async () => {
    if (reportReady && pendingReport) { setReport(pendingReport); setCurrentStep('report'); return; }
    if (reportGenerating) { setLoading(true); return; }
    setLoading(true); setShowPaywall(false);
    await generateReportAPI();
  };

  const generateReportAPI = async () => {
    setReportGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 100));
    const prompt = `You are an HR compliance advisor. Analyze this HR compliance assessment and return ONLY valid JSON.

BUSINESS: ${businessInfo.name}
INDUSTRY: ${businessInfo.industry}
SIZE: ${businessInfo.size}

THEIR ANSWERS:
${Object.entries(answers).map(([q, a]) => `${q}: ${a}`).join('\n')}

SCORING: 25 questions × 20 points = 500 max. Under 200=HIGH RISK, 200-300=ELEVATED RISK, 300-400=MODERATE, 400-500=STRONG

Return JSON: {"score": number, "riskLevel": "string", "criticalCount": number, "attentionCount": number, "goodCount": number, "executiveSummary": "string", "priorities": [{"title": "string", "reason": "string"}], "criticalIssues": [{"topic": "string", "answer": "string", "risk": "string", "fix": "string", "effort": "string"}], "attentionIssues": [same structure], "goodPractices": ["string"], "actionPlan": {"week1": ["string"], "week2to4": ["string"], "ongoing": ["string"]}}`;

    try {
      const response = await fetch('/api/generate-report', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to generate report');
      let reportData;
      try {
        const reportText = data.report || '';
        const cleanJson = reportText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        reportData = JSON.parse(cleanJson);
      } catch (parseError) {
        reportData = { score: 250, riskLevel: 'ELEVATED RISK', criticalCount: 5, attentionCount: 10, goodCount: 10, executiveSummary: 'Assessment completed.', priorities: [{ title: 'Review Critical Issues', reason: 'Address urgent gaps first' }], criticalIssues: [], attentionIssues: [], goodPractices: ['Assessment completed'], actionPlan: { week1: ['Review report'], week2to4: ['Address issues'], ongoing: ['Regular audits'] } };
      }
      setPendingReport(reportData); setReportReady(true); setReportGenerating(false);
      if (loading) { setReport(reportData); setCurrentStep('report'); setLoading(false); }
    } catch (error) {
      const errorReport = { score: 0, riskLevel: 'ERROR', criticalCount: 0, attentionCount: 0, goodCount: 0, executiveSummary: 'Error generating report.', priorities: [], criticalIssues: [], attentionIssues: [], goodPractices: [], actionPlan: { week1: [], week2to4: [], ongoing: [] } };
      setPendingReport(errorReport); setReportReady(true); setReportGenerating(false);
      if (loading) { setReport(errorReport); setCurrentStep('report'); setLoading(false); }
    }
  };

  useEffect(() => { if (currentCategory === 4 && !reportGenerating && !reportReady && Object.keys(answers).length >= 20) { generateReportAPI(); } }, [currentCategory, answers]);
  useEffect(() => { if (loading && reportReady && pendingReport) { setReport(pendingReport); setCurrentStep('report'); setLoading(false); } }, [loading, reportReady, pendingReport]);

  const currentCategoryData = categories[currentCategory];
  const allQuestionsAnswered = currentCategoryData?.questions.every(q => answers[q.id]);
  const totalQuestions = categories.reduce((sum, cat) => sum + cat.questions.length, 0);
  const answeredQuestions = Object.keys(answers).length;

  const baseStyles = { minHeight: '100vh', background: `linear-gradient(135deg, ${colors.darkBg} 0%, ${colors.black} 100%)`, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", color: colors.white, padding: 'clamp(1rem, 4vw, 2rem)', overflowX: 'hidden' };
  const globalStyles = `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'); * { box-sizing: border-box; margin: 0; padding: 0; } html, body { overflow-x: hidden; } body { -webkit-text-size-adjust: 100%; } input, select, button { font-family: inherit; font-size: 16px; } input, select { min-height: 48px; } button { min-height: 48px; touch-action: manipulation; } ::selection { background: ${colors.blue}; color: white; }`;

  // Intro Screen
  if (currentStep === 'intro') {
    return (
      <div style={baseStyles}>
        <style>{globalStyles}</style>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 700, lineHeight: 1.1, marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>
              HRShield<span style={{ color: colors.blue }}>IQ</span><span style={{ fontSize: '0.5em', verticalAlign: 'super' }}>™</span>
            </h1>
            <p style={{ fontSize: '1.2rem', color: colors.white, maxWidth: '520px', margin: '0 auto 0.5rem', lineHeight: 1.4, fontWeight: 500 }}>
              Employment law compliance translated into guidance anyone can follow. <span style={{ color: colors.blue }}>For a fraction of the cost.</span>
            </p>
            <p style={{ fontSize: '1rem', color: colors.grayLight, maxWidth: '500px', margin: '0.75rem auto 0', lineHeight: 1.6 }}>
              A 7-minute HR compliance assessment for <span style={{ color: colors.white, fontWeight: 500 }}>growing businesses</span>, <span style={{ color: colors.white, fontWeight: 500 }}>nonprofits</span>, and <span style={{ color: colors.white, fontWeight: 500 }}>organizations without HR departments</span>.
            </p>
          </div>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '0.5rem 1.5rem', marginBottom: '0.5rem' }}>
              {['7 minutes', '25 questions', 'The cost of lunch', '📱 Works great on mobile'].map((item, i) => (
                <span key={i} style={{ fontSize: '1rem', color: colors.grayLight }}><span style={{ color: colors.blue, marginRight: '0.4rem', fontWeight: 600 }}>✓</span>{item}</span>
              ))}
            </div>
            <p style={{ fontSize: '0.95rem', color: colors.gray, marginBottom: '0.25rem' }}>Questions informed by <span style={{ color: colors.white }}>DOL</span>, <span style={{ color: colors.white }}>EEOC</span>, & <span style={{ color: colors.white }}>SHRM</span> best practices</p>
          </div>
          <div style={{ background: colors.darkCard, borderRadius: '12px', padding: '1.5rem', marginBottom: '0.75rem', textAlign: 'center', borderLeft: `4px solid ${colors.blue}` }}>
            <p style={{ fontSize: '1.1rem', color: colors.white, marginBottom: '0.75rem', lineHeight: 1.5 }}>
              <strong style={{ color: colors.blue }}>41% of small businesses face employment-related claims</strong>, yet most don't have proper documentation.
            </p>
            <p style={{ fontSize: '1.15rem', color: colors.white, fontWeight: 600, lineHeight: 1.4 }}>
              Find out your compliance gaps in <span style={{ color: colors.blue }}>7 minutes</span>.
            </p>
          </div>
          <p style={{ textAlign: 'center', fontSize: '1rem', color: colors.gray, marginBottom: '2rem', lineHeight: 1.5 }}>
            HR compliance audits typically cost $3,000-$10,000+. <span style={{ color: colors.grayLight }}>HRShieldIQ delivers clarity without the consultant price tag.</span>
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            {[
              { icon: '🎯', title: 'Find Gaps', items: ['Documentation', 'Hiring practices', 'Policy compliance', 'Training records', 'Termination process'] },
              { icon: '📊', title: 'Understand Risk', items: ['Plain English', 'Real consequences', 'Industry context', 'Why it matters', 'Lawsuit exposure'] },
              { icon: '✅', title: 'Action Plan', items: ['Prioritized fixes', 'Step-by-step', '30-day roadmap', 'Quick wins first', 'Time estimates'] },
              { icon: '🔗', title: 'Resources', items: ['DOL guidelines', 'EEOC guidance', 'State law links', 'Template forms', 'Best practices'] }
            ].map((card, idx) => (
              <div key={idx} style={{ background: colors.darkCard, borderRadius: '10px', padding: '1.25rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>{card.icon}</div>
                <div style={{ fontWeight: 600, color: colors.white, fontSize: '1rem', marginBottom: '0.75rem' }}>{card.title}</div>
                <div style={{ fontSize: '0.9rem', color: colors.gray, lineHeight: 1.8, textAlign: 'center' }}>
                  {card.items.map((item, i) => (<div key={i}><span style={{ color: colors.blue }}>✓</span> {item}</div>))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ background: colors.blueLight, border: `1px solid ${colors.blueBorder}`, borderRadius: '10px', padding: '1rem 1.25rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1rem', flexShrink: 0 }}>📋</span>
            <p style={{ color: colors.grayLight, fontSize: '0.95rem', lineHeight: 1.5 }}>
              <strong style={{ color: colors.blue }}>Educational guidance only.</strong> This assessment helps identify potential gaps but is not legal advice.
            </p>
          </div>
          <div style={{ textAlign: 'center', marginBottom: '2rem', padding: '1rem', background: colors.darkCard, borderRadius: '10px' }}>
            <p style={{ fontSize: '0.9rem', color: colors.gray, fontStyle: 'italic', lineHeight: 1.6 }}>
              Built by an IT Director who spent 20 years managing HR compliance across 150+ locations. Vetted by a healthcare HR executive who's lived this stuff.
            </p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <button onClick={() => setCurrentStep('business')} style={{ background: colors.blue, color: colors.white, border: 'none', padding: '1rem 2.5rem', fontSize: '1.05rem', fontWeight: 600, borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit', boxShadow: `0 4px 20px ${colors.blue}40` }}>
              Start Free Assessment →
            </button>
            <p style={{ marginTop: '0.75rem', color: colors.gray, fontSize: '1rem' }}>Free score preview. Full report: <span style={{ color: colors.blue }}>$19.99</span></p>
            <p style={{ marginTop: '0.5rem' }}><a href="/sample-report.html" target="_blank" style={{ color: colors.gray, fontSize: '0.95rem', textDecoration: 'none', borderBottom: `1px solid ${colors.grayDark}` }}>View a sample report</a></p>
          </div>
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <p style={{ fontSize: '0.95rem', color: colors.gray, marginBottom: '0.5rem' }}>Powered by <span style={{ color: colors.white }}>TechShield</span> <span style={{ color: colors.blue }}>KC LLC</span></p>
            <p style={{ fontSize: '0.9rem' }}><a href="/privacy.html" style={{ color: colors.gray, textDecoration: 'none', marginRight: '1rem' }}>Privacy Policy</a><a href="/terms.html" style={{ color: colors.gray, textDecoration: 'none' }}>Terms of Service</a></p>
          </div>
        </div>
      </div>
    );
  }

  // Business Info Screen
  if (currentStep === 'business') {
    return (
      <div style={baseStyles}>
        <style>{globalStyles}</style>
        <div style={{ maxWidth: '500px', margin: '0 auto' }}>
          <button onClick={() => setCurrentStep('intro')} style={{ background: 'transparent', border: 'none', color: colors.gray, cursor: 'pointer', fontSize: '0.9rem', fontFamily: 'inherit', marginBottom: '2rem', padding: 0 }}>← Back</button>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>Tell us about your organization</h2>
          <p style={{ color: colors.gray, marginBottom: '1rem', fontSize: '0.95rem' }}>Your report includes <strong style={{ color: colors.grayLight }}>industry-specific compliance requirements</strong>.</p>
          <div style={{ background: colors.darkCard, border: `1px solid ${colors.grayDark}33`, borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1.5rem', fontSize: '0.8rem', color: colors.gray }}>
            <span style={{ color: colors.blue, fontWeight: 600 }}>HRShieldIQ™ Score:</span> 25 questions × 20 points = <span style={{ color: colors.white }}>500 max</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>Organization Name <span style={{ color: colors.blue }}>*</span></label>
              <input type="text" value={businessInfo.name} onChange={e => setBusinessInfo(prev => ({ ...prev, name: e.target.value }))} placeholder="Your Business Name" style={{ width: '100%', padding: '0.875rem 1rem', background: colors.darkCard, border: `1px solid ${colors.grayDark}44`, borderRadius: '8px', color: colors.white, fontSize: '1rem', outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>Industry <span style={{ color: colors.blue }}>*</span></label>
              <select value={businessInfo.industry} onChange={e => setBusinessInfo(prev => ({ ...prev, industry: e.target.value }))} style={{ width: '100%', padding: '0.875rem 1rem', background: colors.darkCard, border: `1px solid ${colors.grayDark}44`, borderRadius: '8px', color: businessInfo.industry ? colors.white : colors.gray, fontSize: '1rem', outline: 'none', cursor: 'pointer' }}>
                <option value="">Select your industry</option>
                <option value="Religious Organization">Religious Organization</option>
                <option value="Daycare / Childcare">Daycare / Childcare</option>
                <option value="Private School">Private School</option>
                <option value="Nonprofit / Association">Nonprofit / Association</option>
                <option value="Healthcare / Medical">Healthcare / Medical</option>
                <option value="Financial Services">Financial Services</option>
                <option value="Retail / E-commerce">Retail / E-commerce</option>
                <option value="Professional Services">Professional Services</option>
                <option value="IT / Technology Services">IT / Technology Services</option>
                <option value="Education">Education</option>
                <option value="Construction">Construction</option>
                <option value="Trades & Repair Services">Trades & Repair Services</option>
                <option value="Personal Services">Personal Services</option>
                <option value="Funeral Services">Funeral Services</option>
                <option value="Manufacturing / Warehouse">Manufacturing / Warehouse</option>
                <option value="Restaurant / Hospitality">Restaurant / Hospitality</option>
                <option value="Real Estate">Real Estate</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>Number of Employees <span style={{ color: colors.blue }}>*</span></label>
              <select value={businessInfo.size} onChange={e => setBusinessInfo(prev => ({ ...prev, size: e.target.value }))} style={{ width: '100%', padding: '0.875rem 1rem', background: colors.darkCard, border: `1px solid ${colors.grayDark}44`, borderRadius: '8px', color: businessInfo.size ? colors.white : colors.gray, fontSize: '1rem', outline: 'none', cursor: 'pointer' }}>
                <option value="">Select employee count</option>
                <option value="1-10">1-10 employees</option>
                <option value="11-25">11-25 employees</option>
                <option value="26-50">26-50 employees</option>
                <option value="51-100">51-100 employees</option>
                <option value="100+">100+ employees</option>
              </select>
              <p style={{ fontSize: '0.75rem', color: colors.grayDark, marginTop: '0.5rem' }}>Different counts trigger different requirements (FMLA at 50+, ACA at 50+, EEO-1 at 100+)</p>
            </div>
            <button onClick={() => setCurrentStep('questions')} disabled={!businessInfo.name || !businessInfo.industry || !businessInfo.size} style={{ background: businessInfo.name && businessInfo.industry && businessInfo.size ? colors.blue : colors.grayDark, color: colors.white, border: 'none', padding: '1rem', fontSize: '1rem', fontWeight: 600, borderRadius: '8px', cursor: businessInfo.name && businessInfo.industry && businessInfo.size ? 'pointer' : 'not-allowed', fontFamily: 'inherit', marginTop: '0.5rem' }}>
              Continue to Assessment →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Questions Screen
  if (currentStep === 'questions') {
    return (
      <div style={baseStyles}>
        <style>{globalStyles}</style>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <button onClick={() => currentCategory > 0 ? setCurrentCategory(currentCategory - 1) : setCurrentStep('business')} style={{ background: 'transparent', border: 'none', color: colors.gray, cursor: 'pointer', fontSize: '0.9rem', fontFamily: 'inherit', padding: 0 }}>← Back</button>
              <span style={{ fontSize: '0.85rem', color: colors.gray }}>{answeredQuestions}/{totalQuestions} questions</span>
            </div>
            <div style={{ height: '6px', background: colors.darkCard, borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(answeredQuestions / totalQuestions) * 100}%`, background: colors.blue, borderRadius: '3px', transition: 'width 0.3s ease' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
            {categories.map((cat, idx) => {
              const catAnswered = cat.questions.filter(q => answers[q.id]).length;
              const isComplete = catAnswered === cat.questions.length;
              const isCurrent = idx === currentCategory;
              return (
                <button key={cat.id} onClick={() => setCurrentCategory(idx)} style={{ background: isCurrent ? colors.blue : colors.darkCard, border: 'none', borderRadius: '8px', padding: '0.6rem 0.8rem', color: isCurrent ? colors.white : colors.gray, cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.75rem', fontWeight: 500, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span>{cat.icon}</span>
                  {isComplete && <span style={{ color: '#22c55e' }}>✓</span>}
                </button>
              );
            })}
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: colors.white, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>{currentCategoryData.icon}</span>{currentCategoryData.title}
            </h2>
            <p style={{ color: colors.gray, fontSize: '0.85rem', marginTop: '0.25rem' }}>Category {currentCategory + 1} of {categories.length}</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {currentCategoryData.questions.map((question, qIdx) => (
              <div key={question.id} style={{ background: colors.darkCard, borderRadius: '12px', padding: '1.25rem', border: answers[question.id] ? `1px solid ${colors.blue}44` : `1px solid ${colors.grayDark}22` }}>
                <p style={{ fontSize: '0.95rem', fontWeight: 500, color: colors.white, marginBottom: '0.5rem', lineHeight: 1.5 }}>{qIdx + 1}. {question.text}</p>
                {question.helper && (<p style={{ fontSize: '0.8rem', color: colors.gray, marginBottom: '1rem', lineHeight: 1.5, paddingLeft: '0.75rem', borderLeft: `2px solid ${colors.grayDark}44` }}>{question.helper}</p>)}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {question.options.map((option, oIdx) => (
                    <button key={oIdx} onClick={() => handleAnswer(question.id, option)} style={{ background: answers[question.id] === option ? colors.blueLight : 'transparent', border: `1px solid ${answers[question.id] === option ? colors.blue : colors.grayDark}44`, borderRadius: '8px', padding: '0.75rem 1rem', color: answers[question.id] === option ? colors.white : colors.grayLight, cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.9rem', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: `2px solid ${answers[question.id] === option ? colors.blue : colors.grayDark}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {answers[question.id] === option && (<div style={{ width: '10px', height: '10px', borderRadius: '50%', background: colors.blue }} />)}
                      </div>
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem', gap: '1rem' }}>
            <button onClick={() => currentCategory > 0 ? setCurrentCategory(currentCategory - 1) : setCurrentStep('business')} style={{ background: colors.darkCard, border: `1px solid ${colors.grayDark}44`, borderRadius: '8px', padding: '0.875rem 1.25rem', color: colors.grayLight, cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.95rem' }}>← Previous</button>
            {currentCategory < categories.length - 1 ? (
              <button onClick={() => setCurrentCategory(currentCategory + 1)} disabled={!allQuestionsAnswered} style={{ background: allQuestionsAnswered ? colors.blue : colors.grayDark, border: 'none', borderRadius: '8px', padding: '0.875rem 1.25rem', color: allQuestionsAnswered ? colors.white : colors.grayDark, cursor: allQuestionsAnswered ? 'pointer' : 'not-allowed', fontFamily: 'inherit', fontSize: '0.95rem', fontWeight: 600 }}>Next Category →</button>
            ) : (
              <button onClick={() => { if (answeredQuestions >= totalQuestions) { setCurrentStep('preview'); } }} disabled={answeredQuestions < totalQuestions} style={{ background: answeredQuestions >= totalQuestions ? colors.blue : colors.grayDark, border: 'none', borderRadius: '8px', padding: '0.875rem 1.25rem', color: answeredQuestions >= totalQuestions ? colors.white : colors.grayDark, cursor: answeredQuestions >= totalQuestions ? 'pointer' : 'not-allowed', fontFamily: 'inherit', fontSize: '0.95rem', fontWeight: 600 }}>See My Results →</button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Loading Screen
  if (loading) {
    return (
      <div style={{ ...baseStyles, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', minHeight: '100vh' }}>
        <style>{`${globalStyles} @keyframes spin { to { transform: rotate(360deg); } } @keyframes bounce { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }`}</style>
        <div style={{ width: '70px', height: '70px', border: `5px solid ${colors.darkCard}`, borderTopColor: colors.blue, borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '2rem' }} />
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', color: colors.white }}>Building Your Report</h2>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem' }}>
          {[0, 0.2, 0.4].map((delay, i) => (<div key={i} style={{ width: '12px', height: '12px', background: colors.blue, borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out', animationDelay: `${delay}s` }} />))}
        </div>
        <p style={{ color: colors.grayLight, fontSize: '1rem', marginBottom: '0.5rem' }}>Analyzing your 25 responses</p>
        <div style={{ marginTop: '2rem', padding: '1rem 1.5rem', background: colors.darkCard, borderRadius: '10px', maxWidth: '300px', textAlign: 'center' }}>
          <p style={{ color: colors.grayDark, fontSize: '0.8rem' }}>⏱️ This usually takes 15-20 seconds</p>
        </div>
      </div>
    );
  }

  // Preview Screen
  if (currentStep === 'preview') {
    const calculateEstimates = () => {
      let critical = 0, attention = 0, good = 0;
      Object.values(answers).forEach(answer => {
        const lower = answer.toLowerCase();
        if (lower.includes('no') || lower.includes('never') || lower.includes('not sure') || lower.includes('none')) { critical++; }
        else if (lower.includes('some') || lower.includes('partial') || lower.includes('occasionally') || lower.includes('informal')) { attention++; }
        else { good++; }
      });
      return { critical, attention, good };
    };
    const estimates = calculateEstimates();
    const displayData = pendingReport ? { critical: pendingReport.criticalCount || 0, attention: pendingReport.attentionCount || 0, good: pendingReport.goodCount || 0 } : estimates;

    return (
      <div style={baseStyles}>
        <style>{globalStyles}</style>
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem 1rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: colors.white, marginBottom: '0.5rem' }}>Assessment Complete!</h1>
            <p style={{ color: colors.gray, fontSize: '0.9rem' }}>{businessInfo.name}</p>
          </div>
          <div style={{ background: colors.darkCard, borderRadius: '16px', padding: '2rem', textAlign: 'center', marginBottom: '1.5rem', border: `2px solid ${colors.blue}`, position: 'relative' }}>
            <div style={{ fontSize: '4rem', fontWeight: 700, color: colors.blue, filter: 'blur(8px)' }}>{pendingReport?.score || 247}</div>
            <div style={{ color: colors.gray, fontSize: '1rem', marginBottom: '1rem' }}>out of 500</div>
            <div style={{ display: 'inline-block', background: '#f59e0b', color: 'white', padding: '0.5rem 1.5rem', borderRadius: '20px', fontSize: '0.9rem', fontWeight: 600, filter: 'blur(4px)' }}>{pendingReport?.riskLevel || 'CALCULATING'}</div>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(0,0,0,0.8)', padding: '0.75rem 1.5rem', borderRadius: '8px', border: `1px solid ${colors.blue}` }}>
              <span style={{ fontSize: '1.5rem' }}>🔒</span><span style={{ color: colors.white, marginLeft: '0.5rem', fontWeight: 600 }}>Unlock Your Score</span>
            </div>
          </div>
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
          <div style={{ background: colors.darkCard, borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: colors.white, marginBottom: '1rem', textAlign: 'center' }}>Your Full Report Includes:</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem' }}>
              {['📊 Detailed HRShieldIQ™ score', '🎯 Top 3 priorities', '⚠️ Critical issue breakdown', '✅ What you\'re doing right', '📋 30-day action plan', '📚 HR compliance resources'].map((item, i) => (
                <div key={i} style={{ color: colors.grayLight, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>{item}</div>
              ))}
            </div>
          </div>
          <button onClick={() => setShowPaywall(true)} style={{ width: '100%', background: colors.blue, border: 'none', borderRadius: '10px', padding: '1rem', color: colors.white, fontSize: '1.1rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', marginBottom: '1rem', boxShadow: `0 4px 20px ${colors.blue}40` }}>
            Unlock Full Report - $19.99
          </button>
          <p style={{ textAlign: 'center', color: colors.gray, fontSize: '0.8rem' }}>One-time purchase • Instant PDF download • 30-day action plan included</p>
        </div>
        {showPaywall && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '0.5rem', overflowY: 'auto' }}>
            <div style={{ background: colors.black, borderRadius: '16px', padding: 'clamp(1rem, 4vw, 2rem)', maxWidth: '450px', width: '100%', maxHeight: '95vh', overflowY: 'auto', border: `1px solid ${colors.grayDark}33`, margin: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: colors.white }}>Unlock Your Report</h2>
                <button onClick={() => setShowPaywall(false)} style={{ background: 'none', border: 'none', color: colors.gray, cursor: 'pointer', fontSize: '1.5rem' }}>×</button>
              </div>
              <div style={{ background: colors.darkCard, borderRadius: '10px', padding: '1rem', marginBottom: '1.5rem' }}>
                <p style={{ color: colors.gray, fontSize: '0.85rem', textAlign: 'center', marginBottom: '0.5rem' }}>We found issues in your assessment:</p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem' }}>
                  <div style={{ textAlign: 'center' }}><span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#dc2626' }}>{displayData.critical}</span><span style={{ fontSize: '0.7rem', color: colors.gray, display: 'block' }}>Critical</span></div>
                  <div style={{ textAlign: 'center' }}><span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f59e0b' }}>{displayData.attention}</span><span style={{ fontSize: '0.7rem', color: colors.gray, display: 'block' }}>Attention</span></div>
                  <div style={{ textAlign: 'center' }}><span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#10b981' }}>{displayData.good}</span><span style={{ fontSize: '0.7rem', color: colors.gray, display: 'block' }}>Good</span></div>
                </div>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', color: colors.gray, fontSize: '0.8rem', marginBottom: '0.5rem' }}>Email (for receipt)</label>
                <input type="email" value={businessInfo.email || ''} onChange={(e) => setBusinessInfo({ ...businessInfo, email: e.target.value })} placeholder="your@email.com" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: `1px solid ${colors.grayDark}`, background: colors.darkCard, color: colors.white, fontFamily: 'inherit', fontSize: '0.9rem' }} />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                {[{ plan: 'onetime', label: 'One-Time Report', price: '$19.99' }, { plan: 'quarterly', label: 'Quarterly Plan', price: '$9.99/qtr', sub: '• Ongoing monitoring' }, { plan: 'annual', label: 'Annual Plan', price: '$29.99/yr', sub: '• 4 reports per year', badge: 'BEST VALUE' }].map(opt => (
                  <div key={opt.plan} onClick={() => setSelectedPlan(opt.plan)} style={{ background: selectedPlan === opt.plan ? colors.blueLight : colors.darkCard, border: `2px solid ${selectedPlan === opt.plan ? colors.blue : colors.grayDark}`, borderRadius: '10px', padding: '1rem', cursor: 'pointer', marginBottom: '0.75rem', position: 'relative' }}>
                    {opt.badge && <div style={{ position: 'absolute', top: '-8px', right: '10px', background: colors.blue, color: 'white', fontSize: '0.65rem', fontWeight: 600, padding: '2px 8px', borderRadius: '4px' }}>{opt.badge}</div>}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: `2px solid ${selectedPlan === opt.plan ? colors.blue : colors.grayDark}`, background: selectedPlan === opt.plan ? colors.blue : 'transparent' }} />
                        <div style={{ fontWeight: 600, color: colors.white, fontSize: '0.9rem' }}>{opt.label} {opt.sub && <span style={{ fontWeight: 400, color: colors.gray, fontSize: '0.75rem' }}>{opt.sub}</span>}</div>
                      </div>
                      <div style={{ fontWeight: 700, color: colors.blue, fontSize: '1.1rem' }}>{opt.price}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input type="text" value={promoCode} onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setPromoError(''); }} placeholder="Promo code (optional)" style={{ flex: 1, padding: '0.6rem 0.75rem', borderRadius: '6px', border: `1px solid ${colors.grayDark}`, background: colors.darkCard, color: colors.white, fontFamily: 'inherit', fontSize: '0.85rem' }} />
                  <button onClick={() => { if (validPromoCodes.includes(promoCode.toUpperCase())) { setPromoError(''); setPaymentComplete(true); setShowPaywall(false); generateReport(); } else if (promoCode.trim() !== '') { setPromoError('Invalid code'); } }} style={{ background: colors.blue, border: 'none', borderRadius: '6px', padding: '0.6rem 1rem', color: colors.white, cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.85rem', fontWeight: 600 }}>Apply</button>
                </div>
                {promoError && <p style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '0.25rem' }}>{promoError}</p>}
              </div>
              <div ref={paypalRef} style={{ marginBottom: '1rem', minHeight: '50px' }}></div>
              <p style={{ color: colors.grayDark, fontSize: '0.7rem', textAlign: 'center' }}>Secure payment via PayPal.</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Report Screen
  if (currentStep === 'report') {
    const downloadPdf = () => {
      if (!report || typeof report.score === 'undefined') { alert('Report data not available.'); return; }
      const r = report;
      const riskColors = { 'HIGH RISK': '#dc2626', 'ELEVATED RISK': '#f59e0b', 'MODERATE': '#3b82f6', 'STRONG': '#10b981' };
      const riskColor = riskColors[r.riskLevel] || '#f59e0b';
      const prioritiesHtml = (r.priorities || []).map((p, i) => `<div class="priority"><strong>${i + 1}. ${p.title}</strong><br><span style="color:#666;">${p.reason}</span></div>`).join('');
      const criticalHtml = (r.criticalIssues || []).length > 0 ? `<h2>⚠️ Critical Issues (${r.criticalIssues.length})</h2>` + r.criticalIssues.map(issue => `<div class="issue critical"><h3>${issue.topic}</h3><p><strong>Your answer:</strong> ${issue.answer}</p><p><strong>Risk:</strong> ${issue.risk}</p><p><strong>How to fix:</strong> ${issue.fix}</p><p><strong>Effort:</strong> ${issue.effort}</p></div>`).join('') : '';
      const attentionHtml = (r.attentionIssues || []).length > 0 ? `<h2>⚡ Needs Attention (${r.attentionIssues.length})</h2>` + r.attentionIssues.map(issue => `<div class="issue attention"><h3>${issue.topic}</h3><p><strong>Your answer:</strong> ${issue.answer}</p><p><strong>Risk:</strong> ${issue.risk}</p><p><strong>How to fix:</strong> ${issue.fix}</p><p><strong>Effort:</strong> ${issue.effort}</p></div>`).join('') : '';
      const goodHtml = (r.goodPractices || []).length > 0 ? `<h2>✅ Good Practices (${r.goodPractices.length})</h2><ul class="good-list">` + r.goodPractices.map(practice => `<li>${practice}</li>`).join('') + `</ul>` : '';
      const week1 = (r.actionPlan?.week1 || []).map(item => `<li>${item}</li>`).join('');
      const week2 = (r.actionPlan?.week2to4 || []).map(item => `<li>${item}</li>`).join('');
      const ongoing = (r.actionPlan?.ongoing || []).map(item => `<li>${item}</li>`).join('');
      const reportWindow = window.open('', '_blank');
      const htmlContent = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>HRShieldIQ Report - ${businessInfo.name}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Segoe UI', system-ui, sans-serif; background: #f8f9fa; color: #333; line-height: 1.6; padding: 20px; }
          .container { max-width: 800px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 2px 20px rgba(0,0,0,0.1); overflow: hidden; }
          .header { background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%); color: white; padding: 30px; text-align: center; }
          .header h1 { font-size: 28px; margin-bottom: 5px; }
          .score-section { padding: 30px; text-align: center; border-bottom: 1px solid #eee; }
          .score-circle { width: 150px; height: 150px; border-radius: 50%; background: conic-gradient(${riskColor} ${(r.score/500)*100}%, #e5e7eb ${(r.score/500)*100}%); display: flex; align-items: center; justify-content: center; margin: 0 auto 15px; }
          .score-inner { width: 120px; height: 120px; border-radius: 50%; background: white; display: flex; flex-direction: column; align-items: center; justify-content: center; }
          .score-number { font-size: 42px; font-weight: 700; color: ${riskColor}; }
          .risk-badge { display: inline-block; background: ${riskColor}; color: white; padding: 8px 20px; border-radius: 20px; font-weight: 600; margin-top: 10px; }
          .content { padding: 30px; }
          h2 { color: #2563EB; font-size: 20px; margin: 25px 0 15px; padding-bottom: 8px; border-bottom: 2px solid #e5e7eb; }
          .priority { background: #f0fdfa; padding: 12px 15px; margin: 8px 0; border-radius: 8px; border-left: 4px solid #2563EB; }
          .issue { padding: 15px; margin: 12px 0; border-radius: 8px; }
          .issue.critical { background: #fef2f2; border-left: 4px solid #dc2626; }
          .issue.attention { background: #fffbeb; border-left: 4px solid #f59e0b; }
          .issue h3 { font-size: 16px; margin-bottom: 8px; }
          .issue p { margin: 5px 0; font-size: 14px; }
          .good-list { list-style: none; }
          .good-list li { padding: 8px 15px; background: #f0fdf4; margin: 5px 0; border-radius: 6px; border-left: 4px solid #22c55e; }
          .action-plan { background: #f8fafc; padding: 20px; border-radius: 10px; margin-top: 20px; }
          .action-week { margin: 15px 0; }
          .action-week h3 { font-size: 16px; color: #334155; margin-bottom: 8px; }
          .action-week ul { margin-left: 20px; }
          .share-box { background: #f1f5f9; padding: 20px; border-radius: 10px; margin-top: 20px; }
          .share-list { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px; }
          .share-item { padding: 10px; background: white; border-radius: 6px; font-size: 13px; }
          .consult-box { background: #2563EB; color: white; padding: 25px; border-radius: 10px; margin-top: 25px; text-align: center; }
          .resources { margin-top: 25px; }
          .res-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-top: 10px; }
          .res-grid a { display: block; padding: 12px; background: #f8fafc; border-radius: 6px; text-align: center; color: #2563EB; text-decoration: none; font-size: 13px; }
          .disclaimer { font-size: 12px; color: #6b7280; padding: 15px; background: #f9fafb; margin-top: 25px; border-radius: 6px; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
        </style></head><body>
        <div class="container">
          <div class="header"><h1>HRShieldIQ™ Report</h1><div class="subtitle">${businessInfo.name} | ${businessInfo.industry} | ${businessInfo.size} employees</div></div>
          <div class="score-section">
            <div class="score-circle"><div class="score-inner"><div class="score-number">${r.score}</div><div class="score-max">out of 500</div></div></div>
            <div class="risk-badge">${r.riskLevel}</div>
            <p style="margin-top:15px;color:#666;font-size:14px;">25 questions × 20 points = 500 max. Higher is better.</p>
          </div>
          <div class="content">
            <h2>Executive Summary</h2><p>${r.executiveSummary || 'Assessment completed.'}</p>
            <h2>Top 3 Priorities</h2>${prioritiesHtml}
            ${criticalHtml}${attentionHtml}${goodHtml}
            <div class="action-plan"><h2>🎯 Your 30-Day Action Plan</h2><div class="action-week"><h3>⚡ Week 1: Quick Wins</h3><ul>${week1}</ul></div><div class="action-week"><h3>🔧 Week 2-4: Core Improvements</h3><ul>${week2}</ul></div><div class="action-week"><h3>🔄 Ongoing</h3><ul>${ongoing}</ul></div></div>
            <div class="share-box"><h3>📤 Who to Share This Report With</h3><div class="share-list"><div class="share-item"><strong>Employment Attorney</strong> - Policy review</div><div class="share-item"><strong>Insurance Agent</strong> - EPLI coverage</div><div class="share-item"><strong>Leadership/Board</strong> - Compliance priorities</div><div class="share-item"><strong>HR Consultant</strong> - Implementation help</div></div></div>
            <div class="consult-box"><h3 style="color:white;margin-bottom:8px;">Need Help Implementing These Recommendations?</h3><p style="margin:0 0 10px;color:rgba(255,255,255,0.9);">TechShield KC can connect you with HR compliance resources.</p><p style="margin:0;"><a href="https://www.techshieldkc.com" style="color:white;text-decoration:none;font-weight:600;">www.techshieldkc.com</a></p></div>
            <div class="resources"><h3>📚 Free HR Resources</h3><div class="res-grid"><a href="https://www.dol.gov/agencies/whd">DOL Wage & Hour</a><a href="https://www.eeoc.gov/employers">EEOC Guidance</a><a href="https://www.shrm.org/topics-tools">SHRM Toolkit</a><a href="https://www.sba.gov/business-guide/manage-your-business/hire-manage-employees">SBA HR Guide</a></div></div>
            <div class="disclaimer"><strong>Important:</strong> This HRShieldIQ™ assessment is educational guidance. It is not legal advice. Consult an employment attorney for specific legal guidance.</div>
          </div>
          <div class="footer"><p><strong>TechShield KC LLC</strong></p><p>hrshieldiq.com | info@techshieldkc.com</p><p style="margin-top:8px;">© ${new Date().getFullYear()} HRShieldIQ™</p></div>
        </div></body></html>`;
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
          {report && report.score && (
            <div style={{ background: colors.darkCard, borderRadius: '12px', padding: '1.5rem', margin: '1.5rem 0' }}>
              <div style={{ fontSize: '3rem', fontWeight: 700, color: colors.blue }}>{report.score}</div>
              <div style={{ color: colors.gray, fontSize: '0.9rem' }}>out of 500</div>
              <div style={{ display: 'inline-block', background: report.riskLevel === 'HIGH RISK' ? '#dc2626' : report.riskLevel === 'ELEVATED RISK' ? '#f59e0b' : report.riskLevel === 'MODERATE' ? '#3b82f6' : '#10b981', color: 'white', padding: '0.4rem 1rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600, marginTop: '0.75rem' }}>{report.riskLevel}</div>
              <div style={{ color: colors.gray, fontSize: '0.75rem', marginTop: '1rem', paddingTop: '0.75rem', borderTop: `1px solid ${colors.grayDark}33` }}>25 questions × 20 points = 500 max. Higher is better.</div>
            </div>
          )}
          <button onClick={downloadPdf} style={{ background: colors.blue, border: 'none', borderRadius: '10px', padding: '1rem 2.5rem', color: colors.white, cursor: 'pointer', fontFamily: 'inherit', fontSize: '1.1rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.75rem', boxShadow: `0 4px 20px ${colors.blue}40`, marginBottom: '2rem' }}>📄 Download PDF Report</button>
          <div style={{ background: colors.blueLight, border: `1px solid ${colors.blueBorder}`, borderRadius: '10px', padding: '1.25rem', marginBottom: '1.5rem' }}>
            <p style={{ fontWeight: 600, color: colors.white, marginBottom: '0.5rem', fontSize: '0.9rem' }}>Need help implementing recommendations?</p>
            <p style={{ color: colors.grayLight, fontSize: '0.8rem', marginBottom: '0.75rem' }}>TechShield KC can connect you with HR compliance resources.</p>
            <a href="mailto:info@techshieldkc.com?subject=HRShieldIQ%20Follow-up" style={{ color: colors.blue, fontSize: '0.85rem', textDecoration: 'none', fontWeight: 500 }}>Contact us →</a>
          </div>
          <button onClick={() => { setCurrentStep('intro'); setCurrentCategory(0); setAnswers({}); setReport(null); setShowPaywall(false); setPaymentComplete(false); }} style={{ background: 'transparent', border: `1px solid ${colors.grayDark}`, borderRadius: '8px', padding: '0.75rem 1.25rem', color: colors.grayLight, cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.85rem' }}>Start New Assessment</button>
          <div style={{ borderTop: `1px solid ${colors.grayDark}33`, paddingTop: '1.5rem', marginTop: '2rem' }}>
            <p style={{ fontSize: '0.7rem', color: colors.grayDark, lineHeight: 1.6 }}>This is an educational assessment, not legal advice.</p>
            <p style={{ fontSize: '0.75rem', color: colors.gray, marginTop: '0.75rem' }}>© {new Date().getFullYear()} HRShieldIQ™ by TechShield KC LLC</p>
            <p style={{ fontSize: '0.7rem', marginTop: '0.5rem' }}><a href="/privacy.html" style={{ color: colors.grayDark, textDecoration: 'none', marginRight: '1rem' }}>Privacy Policy</a><a href="/terms.html" style={{ color: colors.grayDark, textDecoration: 'none' }}>Terms of Service</a></p>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default HRShieldIQ;
