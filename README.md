Inspiration:

The rapid rise of generative AI tools like Sora highlighted how convincingly digital content can be fabricated. This sparked our curiosity about authenticity and trust: how can we know what’s real in a world of synthetic data? That led us to explore encryption, device attestation, and content provenance technologies like C2PA. When we saw Visa’s focus on secure payments, we realized these principles could directly improve fintech security — creating a way to make digital transactions more verifiable, transparent, and trustworthy.

What it does:

C2Pay is a mobile SDK that provides risk-based, adaptive multi-factor authentication (MFA) for payments. It collects device signals, behavioral patterns, and biometrics to calculate a risk score. Only when the score crosses a defined threshold is authentication escalated via C2PA manifests and TEE-backed device keys, ensuring transactions are verified securely while minimizing friction for legitimate users. The SDK integrates seamlessly into any checkout flow, supports hardware-backed security, and provides verifiable proofs for merchants.

How we built it:

We developed a React Native + Expo mobile app to simulate a real shopping experience, showcasing the SDK in action. Payments are mocked via Stripe’s test API, and behavioral signals like motion and tap patterns are collected to compute risk. Secure storage and hashing protect sensitive data. When the risk score exceeds the threshold, a C2PA manifest is generated and signed using TEE-backed keys, creating a transparent, verifiable record for merchants. The app demonstrates how developers can easily embed the SDK into existing payment flows.

Challenges we ran into:

Our initial focus was on detecting AI-generated images through encryption and content verification. Translating these technical concepts to financial security required a major pivot. We had to rethink risk modeling, privacy, and user experience to make an SDK that is both developer-friendly and privacy-first. Balancing strong security with seamless checkout, while integrating TEE and C2PA verification in a lightweight mobile library, was a key challenge.

Accomplishments that we're proud of:

Developed a fully functioning mobile SDK for adaptive MFA.
Implemented risk scoring that triggers verification only when needed.
Integrated TEE-backed key generation and C2PA manifests for cryptographically verifiable transactions.
Created a mock shopping environment demonstrating seamless developer integration.
Built the foundation for privacy-first fraud analytics without compromising user experience. (And most importantly, learned a lot!)

What we learned:

We gained hands-on experience with C2PA (Coalition for Content Provenance and Authenticity), a standard for verifying digital content origin and integrity, and TEE (Trusted Execution Environment), which enables secure, hardware-backed operations. We learned the trade-offs between strong security and frictionless UX and explored the intricacies of creating a Software Development Kit (SDK), focusing on modularity, developer experience, and transparent handling of sensitive data.

What's next for C2Pay:

C2Pay will evolve into a production-ready, cross-platform SDK that developers can drop into any checkout flow with minimal effort. Upcoming features include real-time fraud detection, enhanced risk models using machine learning, and a merchant dashboard to visualize attempted fraud. Long-term, C2Pay aims to become a universal verification layer, where every online transaction carries a cryptographically verifiable record of device integrity and user authenticity.

