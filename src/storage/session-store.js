/**
 * session-store manages user sessions and drafts
 */

class SessionStore {
    constructor() {
        this.currentSession = null;
        this.storageKey = 'draftloom_session';
        this.draftsKey = 'draftloom_drafts';
    }

    async getOrCreateSession() {
        try {
            // Try to load from chrome.storage.local
            if (typeof chrome !== 'undefined' && chrome.storage) {
                const result = await chrome.storage.local.get(this.storageKey);
                if (result[this.storageKey]) {
                    this.currentSession = result[this.storageKey];
                    return this.currentSession;
                }
            }

            // Create new session
            this.currentSession = {
                id: this._generateId(),
                createdAt: Date.now(),
                lastAccess: Date.now(),
                drafts: [],
            };

            await this.saveSession();
            return this.currentSession;
        } catch (error) {
            console.error('Error getting/creating session:', error);
            // Fallback to in-memory session
            this.currentSession = {
                id: this._generateId(),
                createdAt: Date.now(),
                lastAccess: Date.now(),
                drafts: [],
            };
            return this.currentSession;
        }
    }

    async saveSession() {
        if (!this.currentSession) return;

        this.currentSession.lastAccess = Date.now();

        try {
            if (typeof chrome !== 'undefined' && chrome.storage) {
                await chrome.storage.local.set({
                    [this.storageKey]: this.currentSession,
                });
            }
        } catch (error) {
            console.error('Error saving session:', error);
        }
    }

    async saveDraft(draft) {
        if (!this.currentSession) {
            await this.getOrCreateSession();
        }

        const newDraft = {
            id: this._generateId(),
            ...draft,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        this.currentSession.drafts.push(newDraft);
        await this.saveSession();

        return newDraft;
    }

    async getDrafts() {
        if (!this.currentSession) {
            await this.getOrCreateSession();
        }
        return this.currentSession.drafts || [];
    }

    async updateDraft(draftId, updates) {
        if (!this.currentSession) return null;

        const draftIndex = this.currentSession.drafts.findIndex(d => d.id === draftId);
        if (draftIndex === -1) return null;

        this.currentSession.drafts[draftIndex] = {
            ...this.currentSession.drafts[draftIndex],
            ...updates,
            updatedAt: Date.now(),
        };

        await this.saveSession();
        return this.currentSession.drafts[draftIndex];
    }

    async deleteDraft(draftId) {
        if (!this.currentSession) return false;

        const initialLength = this.currentSession.drafts.length;
        this.currentSession.drafts = this.currentSession.drafts.filter(d => d.id !== draftId);

        if (this.currentSession.drafts.length < initialLength) {
            await this.saveSession();
            return true;
        }

        return false;
    }

    async clearSession() {
        this.currentSession = null;

        try {
            if (typeof chrome !== 'undefined' && chrome.storage) {
                await chrome.storage.local.remove(this.storageKey);
            }
        } catch (error) {
            console.error('Error clearing session:', error);
        }
    }

    _generateId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    getSessionInfo() {
        return {
            id: this.currentSession?.id,
            createdAt: this.currentSession?.createdAt,
            lastAccess: this.currentSession?.lastAccess,
            draftCount: this.currentSession?.drafts?.length || 0,
        };
    }
}

export default new SessionStore();
