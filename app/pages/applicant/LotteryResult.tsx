import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import Layout from '../../components/Layout';
import { Trophy, X, Clock } from 'lucide-react';

export default function LotteryResult() {
  const { user } = useAuth();
  const { applications } = useData();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || user.role !== 'applicant') {
      navigate('/login');
    }
  }, [user, navigate]);

  const userApplications = applications.filter((app) => app.applicantId === user?.id);
  const lotteryApplications = userApplications.filter((app) => app.status === 'lottery' || app.status === 'approved');

  return (
    <Layout role="applicant">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Lottery Results</h1>
        <p className="text-gray-600 mb-8">View the results of your condominium house lottery draws</p>

        {lotteryApplications.length === 0 ? (
          <div className="bg-white p-12 rounded-lg shadow border border-gray-200 text-center">
            <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No Lottery Results Yet</h3>
            <p className="text-gray-600 mb-6">
              You don't have any applications in the lottery system. Apply for housing first.
            </p>
            <button
              onClick={() => navigate('/applicant/apply')}
              className="px-6 py-3 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors font-medium"
            >
              Apply for House
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {lotteryApplications.map((app) => (
              <div
                key={app.applicantId}
                className={`bg-white p-6 rounded-lg shadow border-2 ${
                  app.status === 'approved' ? 'border-green-500' : 'border-blue-500'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    {app.status === 'approved' ? (
                      <div className="bg-green-100 p-3 rounded-full">
                        <Trophy className="w-8 h-8 text-green-600" />
                      </div>
                    ) : (
                      <div className="bg-blue-100 p-3 rounded-full">
                        <Clock className="w-8 h-8 text-blue-600" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {app.cycleTitle ?? 'Application'}
                        {app.cycleId ? (
                          <span className="text-gray-500 font-normal text-base"> · Cycle #{app.cycleId}</span>
                        ) : null}
                      </h3>
                      <p className="text-gray-600">
                        Submitted on {new Date(app.applicationDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-4 py-2 rounded-full font-medium ${
                      app.status === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {app.status === 'approved' ? 'Winner' : 'In Lottery'}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600">Your Score</p>
                    <p className="text-2xl font-bold text-blue-600">{app.score}/100</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600">Academic Level</p>
                    <p className="font-medium text-gray-900">{app.academicLevel}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600">Years of Service</p>
                    <p className="font-medium text-gray-900">{app.yearsOfService} years</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600">Job Role</p>
                    <p className="font-medium text-gray-900">{app.jobResponsibility}</p>
                  </div>
                </div>

                {app.status === 'approved' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-bold text-green-900 mb-2">🎉 Congratulations!</h4>
                    <p className="text-green-800">
                      You have been selected in the lottery draw! Please proceed to the placement
                      section to receive your house assignment.
                    </p>
                  </div>
                )}

                {app.status === 'lottery' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-bold text-blue-900 mb-2">In Progress</h4>
                    <p className="text-blue-800">
                      Your application is currently in the lottery pool. Results will be announced
                      soon.
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
