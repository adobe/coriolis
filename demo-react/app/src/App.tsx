import React, { useEffect, useRef, useState } from 'react';
import './App.css';
import { ActionButton, defaultTheme, Flex, Heading, Provider, Radio, RadioGroup, Switch, TextArea} from '@adobe/react-spectrum';
import CoriolisIframe from './CoriolisIframe';
import { Coriolis } from '@adobe/coriolis';

const demo1 = `<h1 id="title">Click on me</h1>
<script>
var h1 = document.querySelector("#title");
var times = 1;
h1.addEventListener("click", () => {
    h1.innerHTML = "Clicked " + times + " times!";
    times++;
});
</script>`;

const App = () => {
  const [value, setValue] = useState('<h1>This is some HTML content</h1>');
  const [liveUpdate, setLiveUpdate] = useState(true);
  const [preview, setPreview] = useState(value);
  const coriolisPreview = useRef<Coriolis>();
  const coriolisPlugin = useRef<Coriolis>();

  const [selection, setSelection] = useState('dogs');

  useEffect(() => {
    if (liveUpdate) {
      setPreview(value);
    }
  }, [liveUpdate, value]);

  return (
    <Provider
      theme={defaultTheme}
      flexGrow={1}
      UNSAFE_style={{ display: 'flex', padding: '2em', width: '100%', gap: '2em' }}
    >
      <Flex direction='column' width='50%'>
        <Heading level={1}>Html content</Heading>
        <TextArea aria-label="Html editor" value={value} onChange={(v) => setValue(v)} width='100%' height="300px" minHeight='300px' marginBottom='size-125' />
        <Flex gap='size-125' marginBottom='size-125'>
          <ActionButton onPress={() => {
            setPreview(value);
          }}>Update preview</ActionButton>
          <ActionButton onPress={() => {
            setValue(demo1)
          }}>Example 1</ActionButton>
          <Switch isSelected={liveUpdate} onChange={setLiveUpdate}>Live update</Switch>
          <RadioGroup orientation='horizontal' value={selection} onChange={(v) => {
            coriolisPlugin.current?.store.set('selection', v);
          }} label="Favorite pet">
            <Radio value="dogs">Dogs</Radio>
            <Radio value="cats">Cats</Radio>
          </RadioGroup>
        </Flex>
        <Heading level={1}>Plugin</Heading>
        <CoriolisIframe coriolisUrl='http://localhost:8081/' setRef={(coriolis) => {
          // PLUGIN
          coriolisPlugin.current = coriolis;
          coriolis.event.on('updatePreview', () => {
            setPreview(value);
          })
          coriolis.store.on('selection', (value) => {
            console.log('App selection change', value);
            setSelection(value);
          });
          coriolis.store.set('selection', selection);

        }}/>
      </Flex>
      <Flex direction='column' width='50%'>
        <Heading level={1}>Preview</Heading>
        <CoriolisIframe html={preview} coriolisUrl='http://localhost:8081/' setRef={(coriolis) => {
          // PREVIEW
          coriolisPreview.current = coriolis;
        }}/>
      </Flex>
    </Provider>
  );
}

export default App;
