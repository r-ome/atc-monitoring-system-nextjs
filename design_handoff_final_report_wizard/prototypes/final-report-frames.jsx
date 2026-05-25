// Compose the full wizard frame: shell (rail) + header + step rail + page + footer

const WizardFrame = ({ step, children, footerProps={} }) => (
  <div className="app-shell" style={{
    width:'100%', height:'100%', display:'flex', overflow:'hidden',
    background:'var(--bg)',
  }}>
    <Rail/>
    <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>
      <Header/>
      <StepRail current={STEPS[step].key}/>
      {children}
      <Footer step={step} {...footerProps}/>
    </div>
  </div>
);

// Step 1 — Setup
const Frame1 = () => (
  <WizardFrame step={0} footerProps={{ leftLabel:'Cancel', rightLabel:'Review items' }}>
    <Page><Step1Setup/></Page>
  </WizardFrame>
);

// Step 2 — Review variants
const Frame2Blocked = () => (
  <WizardFrame step={1} footerProps={{
    rightDisabled: true, rightVariant:'primary', rightLabel:'Continue',
    warn:'12 items still need a decision'
  }}>
    <Step2Review variant="fresh"/>
  </WizardFrame>
);
const Frame2Merge = () => (
  <WizardFrame step={1} footerProps={{
    rightDisabled: true, rightLabel:'Continue',
    warn:'12 items still need a decision'
  }}>
    <Step2Review variant="merge-open"/>
  </WizardFrame>
);
const Frame2Split = () => (
  <WizardFrame step={1} footerProps={{
    rightDisabled: true, rightLabel:'Continue',
    warn:'10 items still need a decision'
  }}>
    <Step2Review variant="split-open"/>
  </WizardFrame>
);
const Frame2Clear = () => (
  <WizardFrame step={1} footerProps={{ rightLabel:'Apply tax' }}>
    <Step2Review variant="all-clear"/>
  </WizardFrame>
);

// Step 3 — Container Tax variants
const FrameTaxFresh = () => (
  <WizardFrame step={2} footerProps={{
    rightLabel:'Preview report',
    warn:'₱24,500 of the tax target still uncovered'
  }}>
    <StepTaxPage variant="fresh"/>
  </WizardFrame>
);
const FrameTaxPartial = () => (
  <WizardFrame step={2} footerProps={{
    rightLabel:'Preview report',
    warn:'₱19,500 of the tax target still uncovered'
  }}>
    <StepTaxPage variant="partial"/>
  </WizardFrame>
);
const FrameTaxMet = () => (
  <WizardFrame step={2} footerProps={{ rightLabel:'Preview report' }}>
    <StepTaxPage variant="met"/>
  </WizardFrame>
);

// Step 4 — Append Inventories
const FrameAppendList = () => (
  <WizardFrame step={3} footerProps={{ rightLabel:'Preview report' }}>
    <StepAppendPage variant="list"/>
  </WizardFrame>
);
const FrameAppendEmpty = () => (
  <WizardFrame step={3} footerProps={{ rightLabel:'Preview report' }}>
    <StepAppendPage variant="empty"/>
  </WizardFrame>
);

// Step 5 — Preview workbook (one variant per sheet)
const Frame3 = () => (
  <WizardFrame step={4} footerProps={{ rightLabel:'Go to finalize' }}>
    <Step3Preview initialSheet="items"/>
  </WizardFrame>
);
const Frame3Final = () => (
  <WizardFrame step={4} footerProps={{ rightLabel:'Go to finalize' }}>
    <Step3Preview initialSheet="final"/>
  </WizardFrame>
);
const Frame3Encode = () => (
  <WizardFrame step={4} footerProps={{ rightLabel:'Go to finalize' }}>
    <Step3Preview initialSheet="encode"/>
  </WizardFrame>
);
const Frame3Unsold = () => (
  <WizardFrame step={4} footerProps={{ rightLabel:'Go to finalize' }}>
    <Step3Preview initialSheet="unsold"/>
  </WizardFrame>
);
const Frame3Bill = () => (
  <WizardFrame step={4} footerProps={{ rightLabel:'Go to finalize' }}>
    <Step3Preview initialSheet="bill"/>
  </WizardFrame>
);

// Step 6 — Finalize
const Frame4 = () => (
  <WizardFrame step={5} footerProps={{
    rightLabel:'Finalize report', rightVariant:'primary',
  }}>
    <Step4Finalize confirmed/>
  </WizardFrame>
);

// Step 5 — Success
const Frame4Success = () => (
  <div className="app-shell" style={{ width:'100%', height:'100%', display:'flex', background:'var(--bg)' }}>
    <Rail/>
    <div style={{ flex:1, display:'flex', flexDirection:'column' }}>
      <Header savedAgo="just now"/>
      <StepRail current="finalize"/>
      <Step4Success/>
    </div>
  </div>
);

window.Frame1 = Frame1;
window.Frame2Blocked = Frame2Blocked;
window.Frame2Merge = Frame2Merge;
window.Frame2Split = Frame2Split;
window.Frame2Clear = Frame2Clear;
window.FrameTaxFresh = FrameTaxFresh;
window.FrameTaxPartial = FrameTaxPartial;
window.FrameTaxMet = FrameTaxMet;
window.FrameAppendList = FrameAppendList;
window.FrameAppendEmpty = FrameAppendEmpty;
window.Frame3 = Frame3;
window.Frame3Final = Frame3Final;
window.Frame3Encode = Frame3Encode;
window.Frame3Unsold = Frame3Unsold;
window.Frame3Bill = Frame3Bill;
window.Frame4 = Frame4;
window.Frame4Success = Frame4Success;
