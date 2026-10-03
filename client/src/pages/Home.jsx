import Button from '../components/Button';
import StatisticsCard from '../components/StatisticsCard';
import BirdCard from '../components/BirdCard';
import Card from '../components/Card';
import useFetch from '../hooks/useFetch';
import { birdApi, migrationApi, statsApi } from '../services/endpoints';

const STEPS = [
  ['👀', 'Spot', 'You find a bird that is injured, trapped or orphaned.'],
  ['📝', 'Report', 'Share a photo, the location and what you see.'],
  ['🚑', 'Rescue', 'A nearby volunteer accepts and travels to the bird.'],
  ['🩺', 'Recover', 'The bird is treated and rehabilitated.'],
  ['🕊️', 'Return', 'When healthy, it is released back to the wild.'],
];

export default function Home() {
  const stats = useFetch(() => statsApi.public());
  const birds = useFetch(() => birdApi.list({ limit: 4 }));
  const migration = useFetch(() => migrationApi.analytics());

  return (
    <>
      <section className="hero">
        <div className="container hero__inner">
          <h1>Every Wing Deserves a Chance to Fly.</h1>
          <p>Report injured birds, connect with rescue volunteers, identify species, and explore bird migration.</p>
          <div className="row row--wrap">
            <Button to="/report-rescue">Report an Injured Bird</Button>
            <Button to="/identify" variant="light">Identify a Bird</Button>
            <Button to="/migration" variant="light">Explore Migration</Button>
          </div>
        </div>
      </section>

      <section className="container section">
        <h2>How Udaanika Works</h2>
        <ol className="steps">
          {STEPS.map(([icon, title, text], i) => (
            <li key={title} className="card steps__item">
              <span className="steps__icon" aria-hidden="true">{icon}</span>
              <small className="muted">Step {i + 1}</small>
              <h3>{title}</h3>
              <p>{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="section section--beige">
        <div className="container">
          <h2>Platform Statistics</h2>
          <div className="grid grid--4">
            <StatisticsCard icon="🪶" label="Birds Rescued" value={stats.data?.birdsRescued} loading={stats.loading} />
            <StatisticsCard icon="🤝" label="Active Volunteers" value={stats.data?.activeVolunteers} loading={stats.loading} tone="blue" />
            <StatisticsCard icon="📋" label="Rescue Requests" value={stats.data?.rescueRequests} loading={stats.loading} />
            <StatisticsCard icon="🔍" label="Species Identified" value={stats.data?.speciesIdentified} loading={stats.loading} tone="blue" />
          </div>
        </div>
      </section>

      <section className="container section">
        <h2>Featured Birds</h2>
        {birds.error ? <p className="muted">Bird information is unavailable right now.</p> : (
          <div className="grid grid--4">
            {birds.loading
              ? [1, 2, 3, 4].map((n) => <div key={n} className="skeleton skeleton--card" />)
              : birds.data.items.map((b) => <BirdCard key={b._id} bird={b} />)}
          </div>
        )}
      </section>

      <section className="section section--beige">
        <div className="container">
          <h2>Migration Insights</h2>
          {migration.loading ? <div className="skeleton skeleton--card" /> : migration.error ? <p className="muted">Migration data is unavailable right now.</p> : (
            <div className="grid grid--3">
              <Card><strong className="stat__value">{migration.data.totalObservations}</strong><p>observations recorded</p></Card>
              <Card><strong className="stat__value">{migration.data.totalBirds}</strong><p>birds counted</p></Card>
              <Card>
                <p><strong>Most observed</strong></p>
                <ul className="plain-list">
                  {migration.data.topSpecies.slice(0, 3).map((s) => <li key={s._id}>{s._id} <span className="muted">({s.observations})</span></li>)}
                </ul>
              </Card>
            </div>
          )}
        </div>
      </section>

      <section className="cta">
        <div className="container">
          <h2>Found an injured bird? Act now.</h2>
          <p>Keep it warm and quiet, away from pets, and report it. Volunteers nearby will be notified.</p>
          <Button to="/report-rescue" variant="light">Report an Injured Bird</Button>
        </div>
      </section>
    </>
  );
}
