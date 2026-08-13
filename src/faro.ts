import { initializeFaro, getWebInstrumentations } from '@grafana/faro-react';  
import { TracingInstrumentation } from '@grafana/faro-web-tracing';  

initializeFaro({  
  url: 'https://faro-collector-prod-ap-south-1.grafana.net/collect/4e87970956d36d4e693403286ffb951a',  
  app: {  
    name: 'Ripple',  
    version: '0.0.0', // from package.json  
    environment: process.env.NODE_ENV,  
  },  
  instrumentations: [...getWebInstrumentations(), new TracingInstrumentation()],  
  ignoreErrors: [  
    // Layout quirks — harmless, not real errors  
    /^ResizeObserver loop limit exceeded$/,  
    /^ResizeObserver loop completed with undelivered notifications$/,  
    // Cross-origin scripts with no useful stack  
    /^Script error\.$/,  
    // Browser extension interference  
    /chrome-extension:\/\//,  
    /moz-extension:\/\//,  
  ],  
});  
