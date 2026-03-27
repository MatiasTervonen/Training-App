import Link from "next/link";
import Navbar from "../components/navbar";
import Footer from "../components/footer";

export default function TermsOfService() {
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
          Terms of Service
        </h1>
        <p className="text-sm text-gray-500 mb-10 font-body">Last updated: March 27, 2026</p>

        <div className="space-y-8 text-sm leading-relaxed">

          <p className="font-body">
            These Terms of Service (&quot;Terms&quot;) govern your use of the Kurvi mobile and web
            application (&quot;App&quot;) operated by Matias Tervonen (&quot;Developer&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;).
            By using the App, you agree to these Terms. If you do not agree, do not use the App.
          </p>

          {/* 1. Eligibility */}
          <section>
            <h2 className="text-xl text-gray-100 mb-4">
              1. Eligibility
            </h2>
            <p className="font-body text-gray-400">
              You must be at least 16 years old to use the App. By creating an account, you confirm
              that you meet this age requirement.
            </p>
          </section>

          {/* 2. Account */}
          <section>
            <h2 className="text-xl text-gray-100 mb-4">
              2. Your Account
            </h2>
            <ul className="list-disc list-inside space-y-1 text-gray-400 font-body">
              <li>You are responsible for maintaining the security of your account and password</li>
              <li>You are responsible for all activity that occurs under your account</li>
              <li>You must provide accurate information when creating your account</li>
              <li>You may delete your account at any time from the App&apos;s settings</li>
            </ul>
          </section>

          {/* 3. Acceptable Use */}
          <section>
            <h2 className="text-xl text-gray-100 mb-4">
              3. Acceptable Use
            </h2>
            <p className="font-body text-gray-400 mb-3">
              You agree not to:
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-400 font-body">
              <li>Use the App for any illegal or unauthorized purpose</li>
              <li>Harass, abuse, or harm other users through chat, feed, or any other feature</li>
              <li>Upload content that is offensive, harmful, or violates the rights of others</li>
              <li>Attempt to gain unauthorized access to the App, other accounts, or our systems</li>
              <li>Use the App to distribute spam, malware, or unwanted content</li>
              <li>Reverse engineer, decompile, or attempt to extract the source code of the App</li>
            </ul>
          </section>

          {/* 4. User Content */}
          <section>
            <h2 className="text-xl text-gray-100 mb-4">
              4. User Content
            </h2>
            <ul className="list-disc list-inside space-y-1 text-gray-400 font-body">
              <li>You retain ownership of all content you create in the App (workouts, notes, photos, etc.)</li>
              <li>By sharing content through the App&apos;s social features (feed, chat), you grant us permission to display that content to other users as intended by the feature</li>
              <li>We do not claim ownership of your content</li>
              <li>You are responsible for the content you upload and share</li>
            </ul>
          </section>

          {/* 5. Health Disclaimer */}
          <section>
            <h2 className="text-xl text-gray-100 mb-4">
              5. Health Disclaimer
            </h2>
            <p className="font-body text-gray-400">
              The App provides tools for tracking fitness, nutrition, and health data. The App is not a
              medical device and does not provide medical advice, diagnosis, or treatment. Always consult
              a qualified healthcare professional before starting any exercise or nutrition program.
              We are not responsible for any injury, health issue, or loss resulting from your use of the App.
            </p>
          </section>

          {/* 6. Nutrition Data */}
          <section>
            <h2 className="text-xl text-gray-100 mb-4">
              6. Nutrition Data Accuracy
            </h2>
            <p className="font-body text-gray-400">
              Nutrition data in the App comes from third-party sources (Open Food Facts, USDA FoodData Central,
              Fineli) and user-submitted entries. We do not guarantee the accuracy, completeness, or reliability
              of any nutrition information. Always verify critical nutrition data independently, especially if
              you have food allergies or dietary restrictions.
            </p>
          </section>

          {/* 7. Availability */}
          <section>
            <h2 className="text-xl text-gray-100 mb-4">
              7. Service Availability
            </h2>
            <ul className="list-disc list-inside space-y-1 text-gray-400 font-body">
              <li>We strive to keep the App available at all times, but we do not guarantee uninterrupted access</li>
              <li>The App may be temporarily unavailable due to maintenance, updates, or circumstances beyond our control</li>
              <li>We reserve the right to modify, suspend, or discontinue the App at any time</li>
            </ul>
          </section>

          {/* 8. Termination */}
          <section>
            <h2 className="text-xl text-gray-100 mb-4">
              8. Termination
            </h2>
            <ul className="list-disc list-inside space-y-1 text-gray-400 font-body">
              <li>You may stop using the App and delete your account at any time</li>
              <li>We may suspend or terminate your account if you violate these Terms</li>
              <li>Upon termination, your right to use the App ceases and your data may be deleted</li>
            </ul>
          </section>

          {/* 9. Limitation of Liability */}
          <section>
            <h2 className="text-xl text-gray-100 mb-4">
              9. Limitation of Liability
            </h2>
            <p className="font-body text-gray-400">
              The App is provided &quot;as is&quot; without warranties of any kind, either express or implied.
              To the fullest extent permitted by law, we shall not be liable for any indirect, incidental,
              special, or consequential damages arising from your use of the App, including but not limited
              to loss of data, loss of profits, or personal injury.
            </p>
          </section>

          {/* 10. Intellectual Property */}
          <section>
            <h2 className="text-xl text-gray-100 mb-4">
              10. Intellectual Property
            </h2>
            <p className="font-body text-gray-400">
              The App, its design, code, branding, and all related materials are the property of
              Matias Tervonen. You may not copy, modify, distribute, or create derivative works
              based on the App without our written permission.
            </p>
          </section>

          {/* 11. Changes */}
          <section>
            <h2 className="text-xl text-gray-100 mb-4">
              11. Changes to These Terms
            </h2>
            <p className="font-body text-gray-400">
              We may update these Terms from time to time. We will notify you of significant changes
              by updating the &quot;Last updated&quot; date at the top. Continued use of the App after
              changes constitutes acceptance of the updated Terms.
            </p>
          </section>

          {/* 12. Governing Law */}
          <section>
            <h2 className="text-xl text-gray-100 mb-4">
              12. Governing Law
            </h2>
            <p className="font-body text-gray-400">
              These Terms are governed by the laws of Finland. Any disputes arising from these Terms
              or your use of the App shall be resolved in the courts of Finland.
            </p>
          </section>

          {/* 13. Contact */}
          <section>
            <h2 className="text-xl text-gray-100 mb-4">
              13. Contact Us
            </h2>
            <p className="font-body text-gray-400">
              If you have any questions about these Terms, please contact us at:
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
