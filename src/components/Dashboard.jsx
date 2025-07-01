import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db, appId } from '../api/firebase'; // Removed getUserId
import { AlertTriangle, CalendarClock, Crown } from 'lucide-react';
import { useAppContext } from '../context/AppContext'; // Import useAppContext
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, CartesianGrid } from 'recharts';

function DashboardStatCard({ title, value, icon, note, color = '#2a3f50', to, state }) {
    const navigate = useNavigate();
    const cardContent = (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-md hover:shadow-xl transition-shadow duration-300 ease-in-out h-full">
            <div className="flex items-start">
                <div className="bg-gray-100 rounded-lg p-3 mr-4" style={{ color }}>
                    {icon}
                </div>
                <div>
                    <p className="text-sm text-gray-500 font-semibold uppercase tracking-wider">{title}</p>
                    <p className="text-3xl font-bold text-gray-800">{value}</p>
                    {note && <p className="text-xs text-gray-400 mt-1">{note}</p>}
                </div>
            </div>
        </div>
    );

    if (to) {
        return (
            <button onClick={() => navigate(to, { state })} className="w-full h-full text-left focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-2xl">
                {cardContent}
            </button>
        );
    }
    return cardContent;
}

function TotalReceivablesCard({ total }) {
    return (
        <div className="text-white p-6 rounded-2xl shadow-lg flex flex-col justify-between h-full bg-gradient-to-br from-blue-500 to-primary">
            <div>
                <p className="text-sm opacity-80">Total Receivables</p>
                <p className="text-4xl font-bold mt-1">₹{total.toLocaleString('en-IN')}</p>
            </div>
            <div className="flex justify-end items-end mt-4">
                <svg width="48" height="32" viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="16" cy="16" r="16" fill="white" fillOpacity="0.3"/>
                    <circle cx="32" cy="16" r="16" fill="white" fillOpacity="0.3"/>
                </svg>
            </div>
        </div>
    )
}

function ChartContainer({ title, children }) {
    return (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-md hover:shadow-xl transition-shadow duration-300 ease-in-out h-full">
            <h3 className="font-bold text-gray-800 mb-4">{title}</h3>
            {children}
        </div>
    );
}

function Dashboard() {
    const { entities, partners, user, isLoading: isContextLoading, isAuthReady } = useAppContext(); // Get user and isAuthReady from context
    const [invoices, setInvoices] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [isDataLoading, setIsDataLoading] = useState(true);

    useEffect(() => {
        // Only proceed if authentication state is ready and a user is logged in
        if (!isAuthReady || !user) {
            setIsDataLoading(false);
            return;
        }

        const invoicesPath = `/artifacts/${appId}/invoices`;
        const customersPath = `/artifacts/${appId}/customers`;

        const qInvoices = query(collection(db, invoicesPath));
        const qCustomers = query(collection(db, customersPath));

        const unsubInvoices = onSnapshot(qInvoices, (snapshot) => {
            setInvoices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setIsDataLoading(false);
        }, (err) => {
            console.error("Error fetching invoices for dashboard: ", err);
            setIsDataLoading(false);
        });

        const unsubCustomers = onSnapshot(qCustomers, (snapshot) => {
            setCustomers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        return () => {
            unsubInvoices();
            unsubCustomers();
        };
    }, [user, isAuthReady]); // Add user and isAuthReady to dependency array


    const { stats, monthlyRevenue, amountByStatus, amountByEntity, amountByPartner, amountByClient, topClients } = useMemo(() => {
        if (invoices.length === 0) {
            return {
                stats: { totalReceivables: 0, overdueCount: 0, dueNext30Days: 0 },
                monthlyRevenue: [], amountByStatus: [], amountByEntity: [],
                amountByPartner: [], amountByClient: [], topClients: [],
            };
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let totalReceivables = 0, overdueCount = 0, dueNext30Days = 0;
        const revenueByMonth = {}, statusAggregates = {}, entityAggregates = {},
            partnerAggregates = {}, clientAggregates = {};

        const entityMap = new Map(entities.map(e => [e.id, e.name]));
        const customerMap = new Map(customers.map(c => [c.id, c.name]));

        invoices.forEach(inv => {
            const total = inv.total || 0;
            const status = inv.status || 'N/A';
            const entityName = entityMap.get(inv.entityId) || 'Unknown';
            const partnerName = inv.partner || 'N/A';
            const clientName = customerMap.get(inv.customerId) || 'Unknown';

            const updateAggregates = (agg, key) => {
                if (!agg[key]) agg[key] = { amount: 0, count: 0 };
                agg[key].amount += total;
                agg[key].count += 1;
            };

            updateAggregates(statusAggregates, status);
            updateAggregates(entityAggregates, entityName);
            updateAggregates(partnerAggregates, partnerName);
            updateAggregates(clientAggregates, clientName);

            if (status !== 'Paid') {
                totalReceivables += total;
                const dueDate = new Date(inv.dueDate);
                if (!isNaN(dueDate.getTime())) {
                    if (dueDate < today) overdueCount++;
                    else if (Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24)) <= 30) dueNext30Days += total;
                }
            }

            const invDate = new Date(inv.invoiceDate);
            if (!isNaN(invDate.getTime())) {
                const monthKey = `${invDate.getFullYear()}-${String(invDate.getMonth() + 1).padStart(2, '0')}`;
                if (!revenueByMonth[monthKey]) revenueByMonth[monthKey] = { amount: 0, count: 0 };
                revenueByMonth[monthKey].amount += total;
            }
        });

        const sortedMonthlyRevenue = Object.keys(revenueByMonth).sort().map(key => ({
            name: new Date(key + '-02').toLocaleString('default', { month: 'short', year: '2-digit' }),
            Revenue: parseFloat(revenueByMonth[key].amount.toFixed(2)),
        }));

        const mapAggregates = (agg) => Object.entries(agg).map(([name, data]) => ({ name, Amount: data.amount, Count: data.count }));

        const topClients = Object.entries(clientAggregates)
            .sort(([, a], [, b]) => b.amount - a.amount)
            .slice(0, 10)
            .map(([name, data], index) => ({ rank: index + 1, name, amount: data.amount }));

        return {
            stats: { totalReceivables, overdueCount, dueNext30Days },
            monthlyRevenue: sortedMonthlyRevenue,
            amountByStatus: mapAggregates(statusAggregates),
            amountByEntity: mapAggregates(entityAggregates),
            amountByPartner: mapAggregates(partnerAggregates),
            amountByClient: mapAggregates(clientAggregates),
            topClients,
        };
    }, [invoices, entities, customers]);

    const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF4560'];
    const tooltipFormatter = (value, name, props) => [`₹${value.toLocaleString('en-IN')} (${props.payload.Count} invoices)`, name];

    if (isContextLoading || !isAuthReady || isDataLoading) {
        return <p>Loading dashboard...</p>;
    }

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-2"><TotalReceivablesCard total={stats.totalReceivables} /></div>
                <DashboardStatCard title="Overdue Invoices" value={stats.overdueCount} icon={<AlertTriangle size={24} />} note="Past their due date" color="#d9534f" to="/invoices" state={{ dueStatus: ['Overdue'] }} />
                <DashboardStatCard title="Amount Due Soon" value={`₹${stats.dueNext30Days.toLocaleString('en-IN')}`} icon={<CalendarClock size={24} />} note="In the next 30 days" color="#5bc0de" to="/invoices" state={{ dueStatus: ['Due'] }} />
            </div>

            <ChartContainer title="Monthly Revenue (All Invoices)">
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={monthlyRevenue} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" fontSize={12} axisLine={false} tickLine={false} />
                        <YAxis fontSize={12} tickFormatter={(value) => `₹${(value/1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ borderRadius: '12px', borderColor: '#e5e7eb', background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(5px)' }} cursor={{fill: 'rgba(240, 240, 240, 0.5)'}} formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Revenue']} />
                        <Bar dataKey="Revenue" fill="#2a3f50" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </ChartContainer>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                <ChartContainer title="Amount by Invoice Status"><ResponsiveContainer width="100%" height={300}><PieChart><Pie data={amountByStatus} dataKey="Amount" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={3} cornerRadius={5}>{amountByStatus.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}</Pie><Tooltip formatter={tooltipFormatter} /><Legend iconSize={10} /></PieChart></ResponsiveContainer></ChartContainer>
                <ChartContainer title="Amount by Entity"><ResponsiveContainer width="100%" height={300}><PieChart><Pie data={amountByEntity} dataKey="Amount" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={3} cornerRadius={5}>{amountByEntity.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}</Pie><Tooltip formatter={tooltipFormatter} /><Legend iconSize={10} /></PieChart></ResponsiveContainer></ChartContainer>
                <ChartContainer title="Amount by Partner"><ResponsiveContainer width="100%" height={300}><PieChart><Pie data={amountByPartner} dataKey="Amount" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={3} cornerRadius={5}>{amountByPartner.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}</Pie><Tooltip formatter={tooltipFormatter} /><Legend iconSize={10} /></PieChart></ResponsiveContainer></ChartContainer>
            </div>

            <ChartContainer title="Top 10 Clients by Revenue">
                <div className="space-y-3">
                    {topClients.map((client, index) => (
                        <div key={client.name} className="flex items-center p-2 rounded-lg">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-600 font-bold mr-4">{client.rank}</div>
                            <div className="flex-grow">
                                <p className="font-semibold text-gray-800">{client.name}</p>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-lg text-primary">₹{client.amount.toLocaleString('en-IN')}</p>
                            </div>
                            {index === 0 && <Crown size={20} className="text-yellow-500 ml-4" />}
                        </div>
                    ))}
                </div>
            </ChartContainer>
        </div>
    );
}

export default Dashboard;