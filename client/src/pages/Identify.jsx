import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Button from '../components/Button';
import Card from '../components/Card';
import Badge from '../components/Badge';
import BirdCard from '../components/BirdCard';
import EmptyState from '../components/EmptyState';
import { useAuth } from '../context/AuthContext';
import { birdApi } from '../services/endpoints';
import { getErrorMessage } from '../services/api';
import { percent } from '../utils/format';

export default function Identify() {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [state, setState] = useState({ status: 'idle' });

  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);

  if (!user) {
    return (
      <div className="container section">
        <EmptyState icon="🔍" title="Log in to identify birds" text="Bird identification is available to registered users." action={<Button to="/login">Log in</Button>} />
      </div>
    );
  }

  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type)) return toast.error('Please choose a JPG, PNG or WEBP image');
    if (f.size > 5 * 1024 * 1024) return toast.error('Image must be under 5 MB');
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setState({ status: 'idle' });
  };

  const identify = async () => {
    const fd = new FormData();
    fd.append('image', file);
    setState({ status: 'loading' });
    try {
      const res = await birdApi.identify(fd);
      setState({ status: 'done', result: res.data.data });
    } catch (err) {
      setState({ status: 'error', message: getErrorMessage(err) });
    }
  };

  const result = state.result;
  return (
    <div className="container section section--narrow">
      <h1>Identify a bird</h1>
      <p className="muted">Upload a clear photo. We only name a species when the model is confident enough; otherwise we’ll tell you we’re not sure.</p>

      <Card>
        <div className="field">
          <label htmlFor="bird-photo">Bird photo (JPG, PNG or WEBP, max 5 MB)</label>
          <input id="bird-photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={onFile} />
        </div>
        {preview && (
          <div className="preview">
            <img src={preview} alt="Selected bird" />
            <div>
              <Button loading={state.status === 'loading'} onClick={identify}>🔍 Identify</Button>
              {state.status === 'error' && <p className="field__error">{state.message}</p>}
            </div>
          </div>
        )}
      </Card>

      {result && (
        <div className="stack result">
          {result.demo && <p className="notice notice--warn">Demo mode: this result is simulated and is not a real identification.</p>}
          <Card>
            <h2>{result.species || 'Not sure about this one'}</h2>
            <div className="meter" aria-label={`Confidence ${percent(result.confidence)}`}>
              <span style={{ width: percent(result.confidence) }} />
            </div>
            <p>
              Confidence: <strong>{percent(result.confidence)}</strong>{' '}
              <Badge status={result.species ? 'Completed' : 'Pending'}>{result.species ? 'Identified' : 'Low confidence'}</Badge>
            </p>
            {!result.species && <p className="muted">Try a sharper photo, closer to the bird, with good light. If the bird is injured, you can still report it without a species.</p>}
          </Card>
          {result.bird && <BirdCard bird={result.bird} />}
          <Button to="/report-rescue" variant="secondary">Report an injured bird</Button>
        </div>
      )}
    </div>
  );
}
