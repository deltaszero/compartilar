# Firebase Security Requirements

- **Detach Listeners**: Always detach Firestore listeners in useEffect cleanup functions
- **Data Validation**: Check for existing data before creating/updating documents
- **Transactions**: Use batched writes or transactions for related operations
- **Audit Logs**: Add change_history for important operations with timestamps
- **Access Control**: Use permissioning through editors/viewers arrays consistently
- **Token Refresh**: After auth operations, refresh token: `await user.getIdToken(true)`
- **Security Rules**: For sensitive operations, validate against security rules first
- **Client-Only Access**: Never bypass security rules with Admin SDK in client code
- **Read Restrictions**: Enforce least-privilege data access with compound queries
- **Auth State**: Always handle authentication state changes securely
- **Anonymous Users**: Migrate anonymous user data properly when converting to permanent accounts
- **Token Expiry**: Handle token expiration gracefully with proper refresh mechanisms