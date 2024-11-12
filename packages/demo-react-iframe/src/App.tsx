import React, { useEffect, useState } from 'react';
import './App.css';
import { Coriolis } from '@adobe/coriolis';
import { ActionButton, defaultTheme, Provider, Radio, RadioGroup } from '@adobe/react-spectrum';

const App = ({coriolis}: {coriolis: Coriolis}) => {
  const [selection, setSelection] = useState('dogs');

  useEffect(() => {
    const cb = (value: string) => {
      console.log('Plugin selection change', value);
      setSelection(value);
    };
    coriolis.store.on('selection', cb);
    return () => {
      coriolis.store.off('selection', cb);
    }
  }, []);

  return (
    <Provider
      theme={defaultTheme}
      flexGrow={1}
      UNSAFE_style={{ display: 'flex', padding: '2em', width: '100%', height: '100%', gap: '2em' }}
    >
      <RadioGroup value={selection} onChange={(v) => {
        coriolis.store.set('selection', v);
      }} label="Favorite pet">
        <Radio value="dogs">Dogs</Radio>
        <Radio value="cats">Cats</Radio>
      </RadioGroup>
      <ActionButton onPress={() => {
        coriolis.event.emit('updatePreview');
      }}>Update preview</ActionButton>
    </Provider>
  );
}

export default App;
