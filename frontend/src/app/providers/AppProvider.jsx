import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from '../store.js';
import { Toaster } from 'sonner';
import { useUiStore } from '@/stores/ui.store.js';

const AppProvider = ({ children }) => {
  const theme = useUiStore(s => s.theme);
  
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <Toaster 
          richColors 
          position='top-center'
          theme={theme}
        />
        {children}
      </PersistGate>
    </Provider>
  );
};

export default AppProvider;