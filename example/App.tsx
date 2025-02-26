import { useEvent } from 'expo';
import VibesReactNativeExpo from 'vibes-react-native-expo';
import { Button, SafeAreaView, ScrollView, Text, View } from 'react-native';

export default function App() {
  const onChangePayload = useEvent(VibesReactNativeExpo, 'onChange');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.container}>
        <Text style={styles.header}>Vibes Expo Example App</Text>
        <Group name="SDK Build Version">
          <Text>{VibesReactNativeExpo.SDKBuildVersion}</Text>
        </Group>
        <Group name="Functions">
          <Button
            title="Register Device"
            onPress={async () => {
              await VibesReactNativeExpo.registerDevice();
            }}
          />
        </Group>
        <Group name="Async functions">
          <Button
            title="Set value"
            onPress={async () => {
              await VibesReactNativeExpo.setValueAsync('Hello from JS!');
            }}
          />
        </Group>
        <Group name="Events">
          <Text>{onChangePayload?.value}</Text>
        </Group>
      </ScrollView>
    </SafeAreaView>
  );
}

function Group(props: { name: string; children: React.ReactNode }) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupHeader}>{props.name}</Text>
      {props.children}
    </View>
  );
}

const styles = {
  header: {
    fontSize: 30,
    margin: 20,
  },
  groupHeader: {
    fontSize: 20,
    marginBottom: 20,
  },
  group: {
    margin: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
  },
  container: {
    flex: 1,
    backgroundColor: '#eee',
  },
  view: {
    flex: 1,
    height: 200,
  },
};
