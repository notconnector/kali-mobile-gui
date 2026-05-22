import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {SafeAreaProvider} from 'react-native-safe-area-context';

import {AppProvider} from './src/context/AppContext';
import {colors, fontSizes} from './src/theme';

import SplashScreen from './src/screens/SplashScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import CategoryScreen from './src/screens/CategoryScreen';
import ToolScreen from './src/screens/ToolScreen';
import ToolDetailScreen from './src/screens/ToolDetailScreen';
import ToolsLibraryScreen from './src/screens/ToolsLibraryScreen';
import AddToolScreen from './src/screens/AddToolScreen';
import TerminalScreen from './src/screens/TerminalScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import ToolScannerScreen from './src/screens/ToolScannerScreen';

const RootStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const DashStack = createNativeStackNavigator();

function DashboardStack() {
  return (
    <DashStack.Navigator screenOptions={{headerShown: false, animation: 'slide_from_right'}}>
      <DashStack.Screen name="DashboardMain" component={DashboardScreen} />
      <DashStack.Screen name="Category" component={CategoryScreen} />
      <DashStack.Screen name="ToolsLibrary" component={ToolsLibraryScreen} />
      <DashStack.Screen name="Tool" component={ToolScreen} />
      <DashStack.Screen name="ToolDetail" component={ToolDetailScreen} />
      <DashStack.Screen name="AddTool" component={AddToolScreen} />
      <DashStack.Screen name="ToolScanner" component={ToolScannerScreen} />
    </DashStack.Navigator>
  );
}

function TabIcon({emoji, label, focused}) {
  return (
    <View style={{alignItems: 'center', paddingTop: 2}}>
      <Text style={{fontSize: focused ? 22 : 19, opacity: focused ? 1 : 0.5}}>{emoji}</Text>
      <Text style={{
        color: focused ? colors.primary : colors.textDim,
        fontSize: 9,
        fontWeight: focused ? '700' : '400',
        letterSpacing: 0.5,
        marginTop: 2,
      }}>
        {label}
      </Text>
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
        },
        tabBarShowLabel: false,
      }}>
      <Tab.Screen
        name="NarzędziaTab"
        component={DashboardStack}
        options={{
          tabBarIcon: ({focused}) => <TabIcon emoji="💀" label="TOOLS" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="TerminalTab"
        component={TerminalScreen}
        options={{
          tabBarIcon: ({focused}) => <TabIcon emoji="🖥️" label="TERMINAL" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="HistoriaTab"
        component={HistoryScreen}
        options={{
          tabBarIcon: ({focused}) => <TabIcon emoji="📜" label="HISTORY" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="UstawieniaTab"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({focused}) => <TabIcon emoji="⚙️" label="SETTINGS" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <NavigationContainer>
          <RootStack.Navigator screenOptions={{headerShown: false}}>
            <RootStack.Screen name="Splash" component={SplashScreen} />
            <RootStack.Screen name="Main" component={MainTabs} />
          </RootStack.Navigator>
        </NavigationContainer>
      </AppProvider>
    </SafeAreaProvider>
  );
}
