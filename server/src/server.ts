import app from './app';
import { config } from './config/env';

app.listen(config.PORT, () => {
    console.log(`Shop running on http://localhost:${config.PORT}`);
});
