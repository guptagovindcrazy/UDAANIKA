import { useState } from 'react';
import toast from 'react-hot-toast';
import Input from './Input';
import Button from './Button';
import LocationMap from './LocationMap';

export default function LocationPicker({ values, onChange, error }) {
  const [locating, setLocating] = useState(false);

  const useMyLocation = () => {
    if (!navigator.geolocation) return toast.error('Geolocation is not supported by this browser');
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        onChange({
          latitude: coords.latitude.toFixed(6),
          longitude: coords.longitude.toFixed(6),
          locationName: values.locationName || `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`,
        });
        setLocating(false);
      },
      () => { setLocating(false); toast.error('Could not get your location. Please type it instead.'); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="location-picker">
      <Input
        label="Location *"
        name="locationName"
        value={values.locationName}
        onChange={(e) => onChange({ locationName: e.target.value })}
        placeholder="Landmark, area or city"
        error={error}
      />
      <Button type="button" variant="secondary" loading={locating} onClick={useMyLocation}>📍 Use my current location</Button>
      <LocationMap latitude={values.latitude} longitude={values.longitude} />
    </div>
  );
}
