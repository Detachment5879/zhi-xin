-- 学院
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 专业
CREATE TABLE majors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    department_id UUID REFERENCES departments(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 班级
CREATE TABLE classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    major_id UUID REFERENCES majors(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 班级-学生关联
CREATE TABLE class_students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID REFERENCES classes(id),
    student_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(class_id, student_id)
);

-- 种子数据
INSERT INTO departments (name) VALUES ('商学院');

INSERT INTO majors (name, department_id)
VALUES ('国际贸易实务', (SELECT id FROM departments WHERE name='商学院'));

INSERT INTO classes (name, major_id)
VALUES ('国贸2301', (SELECT id FROM majors WHERE name='国际贸易实务'));

INSERT INTO class_students (class_id, student_id)
VALUES (
    (SELECT id FROM classes WHERE name='国贸2301'),
    '00000000-0000-0000-0000-000000000005'
);

-- 验证
SELECT d.name as 学院, m.name as 专业, c.name as 班级
FROM class_students cs
JOIN classes c ON cs.class_id = c.id
JOIN majors m ON c.major_id = m.id
JOIN departments d ON m.department_id = d.id
WHERE cs.student_id = '00000000-0000-0000-0000-000000000005';
