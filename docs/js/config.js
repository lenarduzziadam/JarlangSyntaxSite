// Supabase Configuration
// This file centralizes your Supabase settings

class SupabaseConfig {
    constructor() {
        // Check if we're in development (localhost) or production
        this.isDevelopment = window.location.hostname === 'localhost' || 
                           window.location.hostname === '127.0.0.1' ||
                           window.location.hostname === '';

        // Configuration based on environment
        this.config = {
            // Production settings 
            production: {
                supabaseUrl: 'https://iiaytfagmiabwznwxgwx.supabase.co',
                supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlpYXl0ZmFnbWlhYnd6bnd4Z3d4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxMjE3OTUsImV4cCI6MjA3NzY5Nzc5NX0.WxgWhpto79wYwm3BbhRONCyGCDpG9EoZ3sXyDK1KFf0',
                adminPassword: 'alexanderPoliceChad123'
            },
            // Development settings 
            development: {
                supabaseUrl: 'https://iiaytfagmiabwznwxgwx.supabase.co',
                supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlpYXl0ZmFnbWlhYnd6bnd4Z3d4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxMjE3OTUsImV4cCI6MjA3NzY5Nzc5NX0.WxgWhpto79wYwm3BbhRONCyGCDpG9EoZ3sXyDK1KFf0',
                adminPassword: 'alexanderPoliceChad123'
            }
        };
    }

    // Get current environment config
    getConfig() {
        const env = this.isDevelopment ? 'development' : 'production';
        return this.config[env];
    }

    // Get Supabase client
    getSupabaseClient() {
        const config = this.getConfig();
        
        if (config.supabaseUrl === 'YOUR_SUPABASE_URL' || 
            config.supabaseKey === 'YOUR_SUPABASE_ANON_KEY') {
            console.warn('Supabase not configured - running in demo mode');
            return null;
        }

        return supabase.createClient(config.supabaseUrl, config.supabaseKey);
    }

    // Check if Supabase is configured
    isConfigured() {
        const config = this.getConfig();
        return config.supabaseUrl !== 'YOUR_SUPABASE_URL' && 
               config.supabaseKey !== 'YOUR_SUPABASE_ANON_KEY';
    }

    // Get admin password
    getAdminPassword() {
        return this.getConfig().adminPassword;
    }

    // Log current environment
    logEnvironment() {
        console.log(`Running in ${this.isDevelopment ? 'development' : 'production'} mode`);
        console.log(`Supabase configured: ${this.isConfigured()}`);
    }
}

// Export singleton instance
window.supabaseConfig = new SupabaseConfig();