import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import { Course } from '../../types';
import { BookOpen, User, Calendar, Award } from 'lucide-react';

export const StudentCoursesPage: React.FC = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await api.get<{ success: boolean; courses: any[] }>('/dashboard/student');
        if (res.success) setCourses(res.courses);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <h1 className="text-xl font-bold text-slate-900">My Registered Courses</h1>
        <p className="text-xs text-slate-500">
          Official academic courses registered for 2025/2026 First Semester.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full py-12 text-center text-xs text-slate-400">
            Loading enrolled courses...
          </div>
        ) : courses.length === 0 ? (
          <div className="col-span-full py-12 text-center text-xs text-slate-400">
            You are not enrolled in any courses for the current semester.
          </div>
        ) : (
          courses.map((course) => (
            <div
              key={course.course_id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {course.course_code}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    {course.credit_unit} Units
                  </span>
                </div>

                <h3 className="mt-3 text-sm font-bold text-slate-900 leading-snug">
                  {course.course_title}
                </h3>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Lecturer:</span>
                    <span className="font-medium text-slate-800">{course.lecturer_name || 'Unassigned'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Classes Held:</span>
                    <span className="font-bold text-slate-700">{course.total_recorded} sessions</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Your Attendance:</span>
                    <span className={`font-bold ${course.percentage >= 75 ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {course.percentage}% ({course.exam_status})
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100">
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${course.percentage >= 75 ? 'bg-emerald-600' : 'bg-rose-500'}`}
                    style={{ width: `${Math.min(100, course.percentage)}%` }}
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
