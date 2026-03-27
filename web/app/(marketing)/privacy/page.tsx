import Link from "next/link";
import Navbar from "../components/navbar";
import Footer from "../components/footer";

export default function PrivacyPolicy() {
  return (
    <div className="bg-slate-950 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <Navbar />
      </div>

      <main className="max-w-3xl mx-auto px-5 py-12 text-gray-300">
        <Link
          href="/"
          className="text-blue-400 hover:text-blue-300 text-sm mb-8 inline-block font-body"
        >
          &larr; Back to home
        </Link>

        <h1 className="text-3xl text-gray-100 mb-2">
          Privacy Policy
        </h1>
        <p className="text-sm text-gray-500 mb-10 font-body">Last updated: March 27, 2026</p>

        <div className="space-y-8 text-sm leading-relaxed">
          <p className="font-body">
            Matias Tervonen (&quot;Developer&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) operates the
            Kurvi mobile and web application (&quot;App&quot;). This Privacy Policy explains how we
            collect, use, disclose, and safeguard your information when you use our
            App. Please read this policy carefully. If you do not agree with the
            terms of this policy, please do not use the App.
          </p>

          {/* 1. Information We Collect */}
          <section>
            <h2 className="text-xl text-gray-100 mb-4">
              1. Information We Collect
            </h2>

            <h3 className="text-base text-gray-200 mt-4 mb-2">
              Account Information
            </h3>
            <ul className="list-disc list-inside space-y-1 text-gray-400 font-body">
              <li>Email address (used for authentication)</li>
              <li>Display name</li>
              <li>Profile picture</li>
            </ul>

            <h3 className="text-base text-gray-200 mt-4 mb-2">
              Profile &amp; Body Data
            </h3>
            <ul className="list-disc list-inside space-y-1 text-gray-400 font-body">
              <li>Height, gender, and birth date</li>
              <li>Weight entries and history</li>
              <li>Preferred measurement units (weight, distance)</li>
            </ul>

            <h3 className="text-base text-gray-200 mt-4 mb-2">
              Workout &amp; Fitness Data
            </h3>
            <ul className="list-disc list-inside space-y-1 text-gray-400 font-body">
              <li>Gym training sessions: exercises, sets, reps, weight, RPE, duration, calories burned</li>
              <li>Activity sessions: type, duration, distance, steps, notes</li>
              <li>Workout templates and custom exercises</li>
              <li>Step count data from your device&apos;s pedometer</li>
            </ul>

            <h3 className="text-base text-gray-200 mt-4 mb-2">
              Location Data
            </h3>
            <ul className="list-disc list-inside space-y-1 text-gray-400 font-body">
              <li>GPS coordinates, altitude, and accuracy during activity tracking (running, cycling, walking, etc.)</li>
              <li>Location data is collected in the foreground and background while an activity session is active</li>
              <li>Route data is stored to display workout maps</li>
            </ul>

            <h3 className="text-base text-gray-200 mt-4 mb-2">
              Nutrition Data
            </h3>
            <ul className="list-disc list-inside space-y-1 text-gray-400 font-body">
              <li>Food logs: food items, quantities, calories, macronutrients (protein, carbs, fat, fiber, sugar, sodium)</li>
              <li>Meal types and times</li>
              <li>Custom foods and saved meals</li>
              <li>Nutrition goals</li>
              <li>Barcode scans (sent to Open Food Facts API for product lookup)</li>
            </ul>

            <h3 className="text-base text-gray-200 mt-4 mb-2">
              Notes, Todos &amp; Habits
            </h3>
            <ul className="list-disc list-inside space-y-1 text-gray-400 font-body">
              <li>Notes with text content and folder organization</li>
              <li>Todo lists and tasks</li>
              <li>Habit definitions and daily completion logs</li>
            </ul>

            <h3 className="text-base text-gray-200 mt-4 mb-2">
              Reminders &amp; Notifications
            </h3>
            <ul className="list-disc list-inside space-y-1 text-gray-400 font-body">
              <li>Reminder titles, notes, and schedules</li>
              <li>Push notification subscription data (device token, device type)</li>
            </ul>

            <h3 className="text-base text-gray-200 mt-4 mb-2">
              Social &amp; Communication Data
            </h3>
            <ul className="list-disc list-inside space-y-1 text-gray-400 font-body">
              <li>Friends list and friend requests</li>
              <li>Chat messages, reactions, and media</li>
              <li>Activity feed posts, comments, and likes</li>
              <li>Sharing preferences</li>
            </ul>

            <h3 className="text-base text-gray-200 mt-4 mb-2">
              Media Files
            </h3>
            <ul className="list-disc list-inside space-y-1 text-gray-400 font-body">
              <li>Photos, videos, and voice recordings attached to workouts, weight entries, notes, and chat messages</li>
              <li>These files are stored in cloud storage</li>
            </ul>

            <h3 className="text-base text-gray-200 mt-4 mb-2">
              Device Information
            </h3>
            <ul className="list-disc list-inside space-y-1 text-gray-400 font-body">
              <li>Device platform (iOS/Android)</li>
              <li>Device identifier (for push notifications)</li>
              <li>App version</li>
            </ul>

            <h3 className="text-base text-gray-200 mt-4 mb-2">
              User Settings &amp; Preferences
            </h3>
            <ul className="list-disc list-inside space-y-1 text-gray-400 font-body">
              <li>Language preference</li>
              <li>Notification preferences</li>
              <li>GPS tracking preferences</li>
              <li>Day reset hour</li>
            </ul>
          </section>

          {/* 2. How We Use Your Information */}
          <section>
            <h2 className="text-xl text-gray-100 mb-4">
              2. How We Use Your Information
            </h2>
            <p className="mb-3 font-body">We use the information we collect to:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-400 font-body mb-4">
              <li>Provide, operate, and maintain the App</li>
              <li>Create and manage your account</li>
              <li>Track and display your fitness, nutrition, and health data</li>
              <li>Enable social features (friends, chat, activity feed)</li>
              <li>Send push notifications and reminders you configure</li>
              <li>Display workout routes on maps</li>
              <li>Monitor and fix errors and crashes via Sentry</li>
              <li>Improve the App experience</li>
            </ul>
            <p className="mb-3 font-body">
              We do <span className="text-gray-200">not</span> use your data to:
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-400 font-body">
              <li>Serve advertisements</li>
              <li>Sell your personal data to third parties</li>
              <li>Build advertising profiles</li>
            </ul>
          </section>

          {/* 3. Third-Party Services */}
          <section>
            <h2 className="text-xl text-gray-100 mb-4">
              3. Third-Party Services
            </h2>
            <p className="mb-4 font-body">
              We use the following third-party services that may receive some of your data:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse font-body">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="py-2 pr-4 text-gray-200">Service</th>
                    <th className="py-2 pr-4 text-gray-200">Purpose</th>
                    <th className="py-2 text-gray-200">Data Shared</th>
                  </tr>
                </thead>
                <tbody className="text-gray-400">
                  <tr className="border-b border-slate-800">
                    <td className="py-2 pr-4 text-gray-300">Supabase</td>
                    <td className="py-2 pr-4">Backend database &amp; authentication</td>
                    <td className="py-2">All user data, authentication tokens</td>
                  </tr>
                  <tr className="border-b border-slate-800">
                    <td className="py-2 pr-4 text-gray-300">Sentry</td>
                    <td className="py-2 pr-4">Error tracking &amp; crash reporting</td>
                    <td className="py-2">Error logs, device info, session data</td>
                  </tr>
                  <tr className="border-b border-slate-800">
                    <td className="py-2 pr-4 text-gray-300">Mapbox</td>
                    <td className="py-2 pr-4">Map display for workout routes</td>
                    <td className="py-2">GPS coordinates, route data</td>
                  </tr>
                  <tr className="border-b border-slate-800">
                    <td className="py-2 pr-4 text-gray-300">Open Food Facts</td>
                    <td className="py-2 pr-4">Food &amp; barcode lookup</td>
                    <td className="py-2">Product barcodes, food search queries</td>
                  </tr>
                  <tr className="border-b border-slate-800">
                    <td className="py-2 pr-4 text-gray-300">USDA FoodData Central</td>
                    <td className="py-2 pr-4">Food search &amp; nutrition data</td>
                    <td className="py-2">Food search queries</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 text-gray-300">Resend</td>
                    <td className="py-2 pr-4">Transactional email delivery</td>
                    <td className="py-2">Email address, email content</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-4 mb-2 font-body">
              Each third-party service operates under its own privacy policy:
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-400 font-body">
              <li>
                <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                  Supabase Privacy Policy
                </a>
              </li>
              <li>
                <a href="https://sentry.io/privacy/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                  Sentry Privacy Policy
                </a>
              </li>
              <li>
                <a href="https://www.mapbox.com/legal/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                  Mapbox Privacy Policy
                </a>
              </li>
              <li>
                <a href="https://world.openfoodfacts.org/terms-of-use" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                  Open Food Facts Terms of Use
                </a>
              </li>
              <li>
                <a href="https://fdc.nal.usda.gov/api-guide" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                  USDA FoodData Central API Guide
                </a>
              </li>
              <li>
                <a href="https://resend.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                  Resend Privacy Policy
                </a>
              </li>
            </ul>
          </section>

          {/* 4. Data Storage & Security */}
          <section>
            <h2 className="text-xl text-gray-100 mb-4">
              4. Data Storage &amp; Security
            </h2>
            <ul className="list-disc list-inside space-y-1 text-gray-400 font-body">
              <li>Your data is stored on Supabase servers with row-level security (RLS) enabled on all database tables</li>
              <li>Authentication is handled securely through Supabase</li>
              <li>Media files are stored in Supabase cloud storage</li>
              <li>Local data on your device is stored using AsyncStorage and SQLite</li>
              <li>We implement reasonable security measures but cannot guarantee absolute security</li>
            </ul>
          </section>

          {/* 5. Data Retention */}
          <section>
            <h2 className="text-xl text-gray-100 mb-4">
              5. Data Retention
            </h2>
            <ul className="list-disc list-inside space-y-1 text-gray-400 font-body">
              <li>Your data is retained for as long as your account is active</li>
              <li>You may delete individual data entries (workouts, food logs, notes, etc.) at any time within the App</li>
              <li>You can delete your account and all associated data directly from the App&apos;s settings</li>
            </ul>
          </section>

          {/* 6. Your Rights */}
          <section>
            <h2 className="text-xl text-gray-100 mb-4">
              6. Your Rights
            </h2>
            <p className="mb-3 font-body">Depending on your location, you may have the right to:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-400 font-body mb-4">
              <li><span className="text-gray-300">Access</span> your personal data</li>
              <li><span className="text-gray-300">Correct</span> inaccurate data</li>
              <li><span className="text-gray-300">Delete</span> your data</li>
              <li><span className="text-gray-300">Export</span> your data in a portable format</li>
              <li><span className="text-gray-300">Withdraw consent</span> for data processing</li>
              <li><span className="text-gray-300">Object</span> to certain processing of your data</li>
            </ul>
            <p className="mb-4 font-body">
              To exercise any of these rights, contact us at the email address listed below.
            </p>

            <h3 className="text-base text-gray-200 mt-4 mb-2">
              For EU/EEA Users (GDPR)
            </h3>
            <p className="mb-2 font-body">We process your data based on:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-400 font-body">
              <li><span className="text-gray-300">Contract performance</span> — to provide the App&apos;s core functionality</li>
              <li><span className="text-gray-300">Legitimate interest</span> — to improve the App and fix errors</li>
              <li><span className="text-gray-300">Consent</span> — for optional features like location tracking and push notifications</li>
            </ul>

            <h3 className="text-base text-gray-200 mt-4 mb-2">
              For California Users (CCPA)
            </h3>
            <p className="text-gray-400 font-body">
              We do not sell your personal information. You have the right to know what data we collect,
              request deletion, and not be discriminated against for exercising your rights.
            </p>
          </section>

          {/* 7. Children's Privacy */}
          <section>
            <h2 className="text-xl text-gray-100 mb-4">
              7. Children&apos;s Privacy
            </h2>
            <p className="text-gray-400 font-body">
              The App is not intended for children under the age of 16. We do not knowingly collect
              personal information from children under 16. If you are a parent or guardian and believe
              your child has provided us with personal information, please contact us so we can delete
              that data.
            </p>
          </section>

          {/* 8. Location Data */}
          <section>
            <h2 className="text-xl text-gray-100 mb-4">
              8. Location Data
            </h2>
            <ul className="list-disc list-inside space-y-1 text-gray-400 font-body">
              <li>Location data is only collected when you actively start an activity tracking session</li>
              <li>Background location access is used solely to continue tracking your workout route when the App is in the background during an active session</li>
              <li>You can disable location tracking in the App settings or through your device&apos;s permission settings</li>
              <li>Location data is stored to display your workout routes and calculate distance</li>
            </ul>
          </section>

          {/* 9. Changes */}
          <section>
            <h2 className="text-xl text-gray-100 mb-4">
              9. Changes to This Privacy Policy
            </h2>
            <p className="text-gray-400 font-body">
              We may update this Privacy Policy from time to time. We will notify you of any changes
              by updating the &quot;Last updated&quot; date at the top of this policy. You are advised to
              review this Privacy Policy periodically for any changes.
            </p>
          </section>

          {/* 10. Contact */}
          <section>
            <h2 className="text-xl text-gray-100 mb-4">
              10. Contact Us
            </h2>
            <p className="text-gray-400 font-body">
              If you have any questions about this Privacy Policy, please contact us at:
            </p>
            <p className="mt-3 text-gray-300 font-body">
              Email:{" "}
              <a href="mailto:support@kurvi.io" className="text-blue-400 hover:text-blue-300">
                support@kurvi.io
              </a>
            </p>
            <p className="text-gray-300 font-body">
              Developer: Matias Tervonen
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
