/**
 * Admin Vue.js Application
 * Handles admin authentication and report management
 */

const AdminApp = {
    data() {
        return {
            authenticated: false,
            authenticating: false,
            password: '',
            authAlert: {
                show: false,
                type: '',
                message: ''
            },
            alert: {
                show: false,
                type: '',
                message: ''
            },
            reports: [],
            loading: false,
            supabaseConfigured: false,
            filterType: 'all'
        };
    },
    
    computed: {
        filterOptions() {
            return ['all', 'bug', 'feature', 'improvement'];
        },

        filteredReports() {
            if (this.filterType === 'all') return this.reports;
            return this.reports.filter(report => report.type === this.filterType);
        },

        flaggedReports() {
            return this.filteredReports.filter(report => report.flagged);
        },

        activeReports() {
            return this.filteredReports.filter(report => !report.flagged && report.status === 'active');
        },

        // Stats (numbers for dashboard)
        totalReports() {
            return this.filteredReports.length;
        },

        pendingReports() {
            return this.filteredReports.filter(report => report.status === 'pending_review').length;
        },

        approvedReports() {
            return this.filteredReports.filter(report => report.status === 'approved').length;
        },

        rejectedReports() {
            return this.filteredReports.filter(report => report.status === 'rejected').length;
        },

        // Arrays (for listing reports)
        pendingReviewReports() {
            return this.filteredReports.filter(report => report.status === 'pending_review');
        },

        recentReports() {
            return this.filteredReports.filter(report => report.status !== 'pending_review').slice(0, 10);
        },

        currentAdminPassword() {
            return window.supabaseConfig ? window.supabaseConfig.getAdminPassword() : 'admin123';
        }
    },
    
    mounted() {
        // Initialize Supabase service
        this.supabaseService = new window.SupabaseService();
        this.supabaseConfigured = this.supabaseService.isConfigured();
        
        // Check if already authenticated (session storage)
        const isAuth = sessionStorage.getItem('jarlang_admin_auth');
        if (isAuth === 'true') {
            this.authenticated = true;
            this.loadAllReports().catch(error => {
                console.error('Error loading reports on mount:', error);
            });
        }
    },
    
    methods: {
        async authenticate() {
            this.authenticating = true;
            this.hideAuthAlert();
            
            try {
                const correctPassword = window.supabaseConfig.getAdminPassword();
                
                if (this.password === correctPassword) {
                    this.authenticated = true;
                    sessionStorage.setItem('jarlang_admin_auth', 'true');
                    await this.loadAllReports();
                } else {
                    this.showAuthAlert('error', 'Incorrect password. Please try again.');
                }
            } catch (error) {
                console.error('Authentication error:', error);
                this.showAuthAlert('error', 'Authentication failed. Please try again.');
            } finally {
                this.authenticating = false;
                this.password = '';
            }
        },
        
        logout() {
            this.authenticated = false;
            sessionStorage.removeItem('jarlang_admin_auth');
            this.reports = [];
            this.password = '';
        },
        
        async loadAllReports() {
            this.loading = true;
            
            try {
                this.reports = await this.supabaseService.getAllReportsForAdmin();
                
                // Add reactive properties for UI state (Vue 3 doesn't need Vue.set)
                this.reports.forEach(report => {
                    report.updating = false;
                    report.deleting = false;
                });
                
            } catch (error) {
                console.error('Error loading reports:', error);
                this.showAlert('error', 'Could not load reports. Please refresh the page.');
            } finally {
                this.loading = false;
            }
        },
        
        async updateReportStatus(report, newStatus) {
            report.updating = true;
            
            try {
                await this.supabaseService.updateReportStatus(report.id, newStatus);
                
                // Update local state
                report.status = newStatus;
                if (newStatus === 'approved') {
                    report.flagged = false;
                }
                
                this.showAlert('success', `Report ${newStatus} successfully.`);
                
            } catch (error) {
                console.error('Error updating report:', error);
                this.showAlert('error', `Failed to update report status: ${error.message}`);
            } finally {
                report.updating = false;
            }
        },
        
        async approveReport(report) {
            await this.updateReportStatus(report, 'approved');
        },
        
        async rejectReport(report) {
            await this.updateReportStatus(report, 'rejected');
        },
        
        async unflagReport(report) {
            report.updating = true;
            
            try {
                await this.supabaseService.updateReportStatus(report.id, 'active');
                
                // Update local state
                report.flagged = false;
                report.status = 'active';
                
                this.showAlert('success', 'Report unflagged and made active.');
                
            } catch (error) {
                console.error('Error unflagging report:', error);
                this.showAlert('error', `Failed to unflag report: ${error.message}`);
            } finally {
                report.updating = false;
            }
        },
        
        async deleteReport(report) {
            if (!confirm('Are you sure you want to permanently delete this report? This action cannot be undone.')) {
                return;
            }
            
            report.deleting = true;
            
            try {
                await this.supabaseService.deleteReport(report.id);
                
                // Remove from local state
                const index = this.reports.findIndex(r => r.id === report.id);
                if (index !== -1) {
                    this.reports.splice(index, 1);
                }
                
                this.showAlert('success', 'Report deleted successfully.');
                
            } catch (error) {
                console.error('Error deleting report:', error);
                this.showAlert('error', `Failed to delete report: ${error.message}`);
            } finally {
                report.deleting = false;
            }
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
        
        showAuthAlert(type, message) {
            this.authAlert = {
                show: true,
                type: type === 'success' ? 'alert-success' : 'alert-error',
                message
            };
            
            setTimeout(() => {
                this.hideAuthAlert();
            }, 5000);
        },
        
        hideAuthAlert() {
            this.authAlert.show = false;
        },
        
        formatDate(dateString) {
            const date = new Date(dateString);
            return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString();
        },
        
        getStatusBadgeClass(status, flagged) {
            if (flagged) return 'status-flagged';
            switch (status) {
                case 'active': return 'status-active';
                case 'approved': return 'status-approved';
                case 'rejected': return 'status-rejected';
                default: return 'status-unknown';
            }
        }
    }
};

// Export for use in HTML
window.AdminApp = AdminApp;