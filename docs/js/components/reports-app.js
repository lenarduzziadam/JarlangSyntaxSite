/**
 * Reports Vue.js Application
 * Handles report submissions and management
 */

// Import utilities (will be available globally)
// const { SupabaseService } = window.SupabaseService;
// const { AlertManager } = window.AlertManager;

const ReportsApp = {
    data() {
        return {
            form: {
                type: '',
                title: '',
                description: '',
                contact: ''
            },
            reports: [],
            loading: false,
            submitting: false,
            supabaseConfigured: false,
            alert: {
                show: false,
                type: '',
                message: ''
            }
        };
    },
    
    computed: {
        visibleReports() {
            return this.reports.filter(report => !report.flagged || report.status === 'approved');
        },
        
        flaggedCount() {
            return this.reports.filter(report => report.flagged && report.status !== 'approved').length;
        }
    },
    
    async mounted() {
        // Initialize Supabase service
        this.supabaseService = new window.SupabaseService();
        this.supabaseConfigured = this.supabaseService.isConfigured();
        
        // Load initial reports
        await this.loadReports();
    },
    
    methods: {
        async submitReport() {
            this.submitting = true;
            this.hideAlert();

            try {
                const reportData = {
                    type: this.form.type,
                    title: this.form.title,
                    description: this.form.description,
                    contact: this.form.contact || null,
                    created_at: new Date().toISOString()
                };

                await this.supabaseService.createReport(reportData);
                
                this.showAlert('success', 'Thank you! Your report has been submitted successfully.');
                this.resetForm();
                await this.loadReports();
                
            } catch (error) {
                console.error('Error submitting report:', error);
                this.showAlert('error', 'Sorry, there was an error submitting your report. Please try again.');
            } finally {
                this.submitting = false;
            }
        },
        
        async loadReports() {
            this.loading = true;
            
            try {
                this.reports = await this.supabaseService.getReports();
            } catch (error) {
                console.error('Error loading reports:', error);
                this.showAlert('error', 'Could not load reports. Please refresh the page.');
            } finally {
                this.loading = false;
            }
        },
        
        async flagReport(report) {
            // Set loading state for this specific report
            report.flagging = true;
            
            try {
                await this.supabaseService.flagReport(report.id);
                
                // Remove the flagged report from local display
                const reportIndex = this.reports.findIndex(r => r.id === report.id);
                if (reportIndex !== -1) {
                    this.reports.splice(reportIndex, 1);
                }
                
                this.showAlert('success', 'Report flagged for review and hidden from public view. Thank you for helping maintain content quality.');
                
            } catch (error) {
                console.error('Error flagging report:', error);
                this.showAlert('error', `Could not flag report: ${error.message || 'Unknown error'}`);
            } finally {
                report.flagging = false;
            }
        },
        
        resetForm() {
            this.form = {
                type: '',
                title: '',
                description: '',
                contact: ''
            };
        },
        
        showAlert(type, message) {
            this.alert = {
                show: true,
                type: type === 'success' ? 'alert-success' : 'alert-error',
                message
            };
            
            setTimeout(() => {
                this.hideAlert();
            }, 5000);
        },
        
        hideAlert() {
            this.alert.show = false;
        },
        
        formatDate(dateString) {
            const date = new Date(dateString);
            return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString();
        }
    }
};

// Export for use in HTML
window.ReportsApp = ReportsApp;