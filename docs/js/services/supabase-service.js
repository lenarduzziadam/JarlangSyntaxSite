/**
 * Supabase Service Layer
 * Handles all Supabase interactions and provides demo mode fallback
 */

class SupabaseService {
    constructor() {
        this.config = window.supabaseConfig;
        this.client = this.config.getSupabaseClient();
        this.configured = this.config.isConfigured();
        
        // Log environment info
        this.config.logEnvironment();
    }
    
    /**
     * Check if Supabase is properly configured
     * @returns {boolean}
     */
    isConfigured() {
        return this.configured;
    }
    
    /**
     * Get the Supabase client
     * @returns {Object|null}
     */
    getClient() {
        return this.client;
    }
    
    /**
     * Create a new report
     * @param {Object} reportData - Report data to insert
     * @returns {Promise<Object>}
     */
    async createReport(reportData) {
        // Demo mode simulation
        if (!this.client) {
            return new Promise((resolve) => {
                setTimeout(() => {
                    const demoReport = {
                        id: Date.now(),
                        ...reportData,
                        flagged: false,
                        status: 'active'
                    };
                    resolve(demoReport);
                }, 1000);
            });
        }
        
        const { data, error } = await this.client
            .from('jarlang_reports')
            .insert([reportData])
            .select();
            
        if (error) throw error;
        return data[0];
    }
    
    /**
     * Get reports with filtering for public view
     * @param {number} limit - Maximum number of reports to fetch
     * @returns {Promise<Array>}
     */
    async getReports(limit = 20) {
        // Demo mode - return sample data
        if (!this.client) {
            return new Promise((resolve) => {
                setTimeout(() => {
                    const sampleReports = [
                        {
                            id: 1,
                            type: 'feature',
                            title: 'Add for loop syntax',
                            description: 'It would be great to have a more traditional for loop syntax in addition to the while loop.',
                            created_at: new Date(Date.now() - 86400000).toISOString(),
                            flagged: false,
                            status: 'active'
                        },
                        {
                            id: 2,
                            type: 'bug',
                            title: 'Error with nested function calls',
                            description: 'When calling functions inside other functions, I get an unexpected parsing error.',
                            created_at: new Date(Date.now() - 172800000).toISOString(),
                            flagged: false,
                            status: 'active'
                        },
                        {
                            id: 3,
                            type: 'improvement',
                            title: 'Better error messages',
                            description: 'Error messages could be more descriptive to help with debugging.',
                            created_at: new Date(Date.now() - 259200000).toISOString(),
                            flagged: false,
                            status: 'active'
                        }
                    ];
                    resolve(sampleReports);
                }, 500);
            });
        }
        
        const { data, error } = await this.client
            .from('jarlang_reports')
            .select('*')
            .or('flagged.eq.false,status.eq.approved')
            .order('created_at', { ascending: false })
            .limit(limit);
            
        if (error) throw error;
        return data || [];
    }
    
    /**
     * Flag a report as inappropriate
     * @param {number} reportId - ID of the report to flag
     * @returns {Promise<Object>}
     */
    async flagReport(reportId) {
        // Demo mode simulation
        if (!this.client) {
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve({ success: true });
                }, 1000);
            });
        }
        
        const { data, error } = await this.client
            .from('jarlang_reports')
            .update({ 
                flagged: true, 
                status: 'pending_review',
                flagged_at: new Date().toISOString()
            })
            .eq('id', reportId)
            .select();
            
        if (error) throw error;
        return data[0];
    }
    
    /**
     * Get all reports for admin view (including flagged ones)
     * @returns {Promise<Array>}
     */
    async getAllReportsForAdmin() {
        if (!this.client) {
            // Return demo data including flagged items for admin
            const demoReports = await this.getReports();
            return [
                ...demoReports,
                {
                    id: 99,
                    type: 'spam',
                    title: 'Spam report example',
                    description: 'This is a sample flagged report for demo purposes.',
                    created_at: new Date().toISOString(),
                    flagged: true,
                    status: 'pending_review'
                }
            ];
        }
        
        const { data, error } = await this.client
            .from('jarlang_reports')
            .select('*')
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        return data || [];
    }
    
    /**
     * Update report status (admin only)
     * @param {number} reportId - ID of the report
     * @param {string} status - New status ('active', 'approved', 'rejected')
     * @returns {Promise<Object>}
     */
    async updateReportStatus(reportId, status) {
        if (!this.client) {
            return new Promise((resolve) => {
                setTimeout(() => resolve({ success: true }), 500);
            });
        }
        
        const updates = { 
            status: status,
            updated_at: new Date().toISOString()
        };
        
        // If approving a flagged report, unflag it
        if (status === 'approved') {
            updates.flagged = false;
        }
        
        const { data, error } = await this.client
            .from('jarlang_reports')
            .update(updates)
            .eq('id', reportId)
            .select();
            
        if (error) throw error;
        return data[0];
    }
    
    /**
     * Delete a report (admin only)
     * @param {number} reportId - ID of the report to delete
     * @returns {Promise<boolean>}
     */
    async deleteReport(reportId) {
        if (!this.client) {
            return new Promise((resolve) => {
                setTimeout(() => resolve(true), 500);
            });
        }
        
        const { error } = await this.client
            .from('jarlang_reports')
            .delete()
            .eq('id', reportId);
            
        if (error) throw error;
        return true;
    }
}

// Export for global use
window.SupabaseService = SupabaseService;