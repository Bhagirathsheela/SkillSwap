import React from "react";

const steps = [
  {
    img: "/images/share.png",
    title: "Share Your Skills",
    desc: "Let others know what you're good at – design, coding, etc.",
  },
  {
    img: "/images/learn.png",
    title: "Add What You Want to Learn",
    desc: "Mention what you're looking for – design, speaking...",
  },
  {
    img: "/images/match.png",
    title: "Get Matched",
    desc: "We connect you with people who can teach you.",
  },
];

const HowItWorks = () => {
  return (
    <section className="how_it_works" aria-labelledby="how-it-works-heading">
      <div className="how_it_works-inner">
        <div className="how_it_works-label">The process</div>
        <h2 id="how-it-works-heading">How It Works</h2>
        <p className="how_it_works-subtitle">
          Three simple steps to start swapping skills with people around you.
        </p>
        <div className="steps">
          {steps.map((step, index) => (
            <div key={index} className="step">
              {/* <div className="step-number">{String(index + 1).padStart(2, "0")}</div> */}
              <div className="icon">
                <img src={step.img} alt="" aria-hidden="true" />
              </div>
              <h3 className="step-title">{step.title}</h3>
              <p className="step-desc">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
