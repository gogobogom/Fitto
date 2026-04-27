import { NextResponse, type NextRequest } from 'next/server';

const mockErrors = [
  {
    id: '1',
    errorType: 'TypeError',
    message: 'Cannot read property "calories" of undefined',
    stack: `TypeError: Cannot read property 'calories' of undefined
    at calculateDailyTotal (meal-tracker.ts:45:23)
    at MealCard.render (MealCard.tsx:89:15)
    at ReactDOM.render (react-dom.js:1234:10)`,
    userId: 'user123',
    timestamp: Date.now() - 2 * 60 * 60 * 1000,
    resolved: false,
  },
  {
    id: '2',
    errorType: 'NetworkError',
    message: 'Failed to fetch user profile data',
    stack: `NetworkError: Request failed with status code 500
    at fetchUserProfile (api-client.ts:67:12)
    at Profile.loadData (Profile.tsx:34:8)`,
    userId: 'user456',
    timestamp: Date.now() - 6 * 60 * 60 * 1000,
    resolved: false,
  },
  {
    id: '3',
    errorType: 'ReferenceError',
    message: 'window is not defined',
    stack: `ReferenceError: window is not defined
    at getLocalStorage (utils.ts:12:5)
    at Component.init (component.tsx:23:10)`,
    userId: null,
    timestamp: Date.now() - 24 * 60 * 60 * 1000,
    resolved: true,
  },
  {
    id: '4',
    errorType: 'ValidationError',
    message: 'Invalid email format provided',
    stack: `ValidationError: Invalid email format
    at validateEmail (validation.ts:45:11)
    at handleSubmit (LoginForm.tsx:67:8)`,
    userId: 'user789',
    timestamp: Date.now() - 12 * 60 * 60 * 1000,
    resolved: false,
  },
];

export async function GET(req: NextRequest) {
  try {
    const sessionId = req.cookies.get('admin_session')?.value;
    if (!sessionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Fetch from database/logging service
    return NextResponse.json({ errors: mockErrors });
  } catch (error: any) {
    console.error('Failed to fetch errors:', error);
    return NextResponse.json({ error: 'Failed to fetch errors' }, { status: 500 });
  }
}
