import { Link } from 'react-router-dom'
import './Architecture.css'

const layers = [
  {
    n: 3,
    title: 'API layer',
    body: 'Connects the Kenya Vehicles frontend to the backend services that power listings, loans, messages, and portals.',
  },
  {
    n: 4,
    title: 'Backend',
    body: 'Processes requests and business logic — dealer inventory, rental hire cars, loan applications, reviews, and enquiries.',
  },
  {
    n: 5,
    title: 'Authentication',
    body: 'Manages users, roles, and permissions for buyers, dealers, loan agents, and admins.',
  },
  {
    n: 6,
    title: 'Database',
    body: 'Stores users, car and rental listings, loan applications, messages, reviews, and transactions.',
  },
  {
    n: 7,
    title: 'File storage',
    body: 'Stores images, documents, and videos — yard logos, sale photos, and hire-car galleries.',
  },
  {
    n: 8,
    title: 'Infrastructure',
    body: 'Hosting, networking, and deployment for the marketplace and partner portals.',
  },
  {
    n: 9,
    title: 'Security',
    body: 'Protects the entire platform — access control, safe uploads, and account reporting.',
  },
  {
    n: 10,
    title: 'Monitoring',
    body: 'Tracks performance, errors, and uptime so Kenya Vehicles stays reliable for buyers and yards.',
  },
]

const steps = [
  {
    title: 'Frontend',
    body: 'A dealer fills in the car listing form in the dealer portal (make, model, price, photos).',
  },
  {
    title: 'API',
    body: 'Sends the vehicle information and images to the server.',
  },
  {
    title: 'Backend',
    body: "Validates the information and checks the dealer's permissions to publish stock.",
  },
  {
    title: 'Database',
    body: 'Saves the vehicle details in PostgreSQL (Neon).',
  },
  {
    title: 'File storage',
    body: 'Saves listing photos in Vercel Blob (or equivalent object storage).',
  },
  {
    title: 'Frontend',
    body: 'Displays the newly published car to visitors on Browse, Home, and the dealer page.',
  },
]

export function Architecture() {
  return (
    <section className="section arch-page">
      <div className="container">
        <nav className="amz-crumb">
          <Link to="/">Kenya Vehicles</Link>
          <span>›</span>
          <span>Platform architecture</span>
        </nav>

        <div className="arch-hero">
          <p className="eyebrow">How Kenya Vehicles is built</p>
          <h1>Platform layers</h1>
          <p>
            From the marketplace UI to hosting and security — these layers work together so dealers,
            loan agents, and buyers can list, finance, and buy cars across Kenya.
          </p>
        </div>

        <div className="arch-layers">
          {layers.map((layer) => (
            <article key={layer.n} className="panel-card arch-layer">
              <div className="arch-layer-num" aria-hidden="true">
                {layer.n}
              </div>
              <div>
                <h2>{layer.title}</h2>
                <p>{layer.body}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="arch-flow">
          <div className="arch-flow-head">
            <p className="eyebrow">How they communicate</p>
            <h2>Example: listing a car on Kenya Vehicles</h2>
            <p>
              Imagine a dealer publishing a sale unit from the yard portal — the same pattern applies
              to hire cars and loan applications.
            </p>
          </div>

          <ol className="arch-steps">
            {steps.map((step) => (
              <li key={step.title + step.body.slice(0, 12)}>
                <div>
                  <strong>{step.title}</strong>
                  <span>{step.body}</span>
                </div>
              </li>
            ))}
          </ol>

          <p className="arch-note">
            The app currently uses the browser and local storage for speed. The target production
            shape follows this stack: API + backend + auth + PostgreSQL (Neon) + blob file storage
            + hosted infrastructure with security and monitoring.
          </p>
        </div>
      </div>
    </section>
  )
}
