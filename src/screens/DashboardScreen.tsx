import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { Text, Card, Chip, DataTable } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';

const screenWidth = Dimensions.get('window').width;

export default function DashboardScreen() {
  const [stats, setStats] = useState<any>(null);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load payment history
      const history = await AsyncStorage.getItem('payment_history');
      const payments = history ? JSON.parse(history) : [];
      
      setRecentPayments(payments.slice(0, 10)); // Last 10 transactions

      // Calculate stats
      if (payments.length > 0) {
        const totalPayments = payments.length;
        const autoApproved = payments.filter((p: any) => 
          !p.manifest.claim.activeBiometric
        ).length;
        const mfaRequired = payments.filter((p: any) => 
          p.manifest.claim.activeBiometric?.verified
        ).length;
        
        const avgRisk = Math.round(
          payments.reduce((sum: number, p: any) => 
            sum + p.manifest.claim.behavioral.riskScore, 0
          ) / totalPayments
        );

        const totalAmount = payments.reduce((sum: number, p: any) => 
          sum + p.amount, 0
        );

        setStats({
          totalPayments,
          autoApproved,
          mfaRequired,
          avgRisk,
          totalAmount,
        });
      } else {
        setStats({
          totalPayments: 0,
          autoApproved: 0,
          mfaRequired: 0,
          avgRisk: 0,
          totalAmount: 0,
        });
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  };

  const getRiskColor = (risk: number) => {
    if (risk > 70) return '#C62828';
    if (risk > 40) return '#F57C00';
    return '#2E7D32';
  };

  const getRiskBgColor = (risk: number) => {
    if (risk > 70) return '#FFEBEE';
    if (risk > 40) return '#FFF3E0';
    return '#E8F5E9';
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        📊 Analytics Dashboard
      </Text>

      {stats && (
        <>
          {/* Summary Cards */}
          <View style={styles.statsGrid}>
            <Card style={styles.statCard}>
              <Card.Content>
                <Text variant="titleSmall" style={styles.statLabel}>
                  Total Transactions
                </Text>
                <Text variant="displaySmall" style={styles.statValue}>
                  {stats.totalPayments}
                </Text>
              </Card.Content>
            </Card>

            <Card style={styles.statCard}>
              <Card.Content>
                <Text variant="titleSmall" style={styles.statLabel}>
                  Auto-Approved
                </Text>
                <Text variant="displaySmall" style={[styles.statValue, { color: '#2E7D32' }]}>
                  {stats.autoApproved}
                </Text>
                <Text variant="bodySmall" style={styles.statSubtext}>
                  {stats.totalPayments > 0 
                    ? `${Math.round((stats.autoApproved / stats.totalPayments) * 100)}%`
                    : '0%'}
                </Text>
              </Card.Content>
            </Card>

            <Card style={styles.statCard}>
              <Card.Content>
                <Text variant="titleSmall" style={styles.statLabel}>
                  MFA Required
                </Text>
                <Text variant="displaySmall" style={[styles.statValue, { color: '#F57C00' }]}>
                  {stats.mfaRequired}
                </Text>
                <Text variant="bodySmall" style={styles.statSubtext}>
                  {stats.totalPayments > 0 
                    ? `${Math.round((stats.mfaRequired / stats.totalPayments) * 100)}%`
                    : '0%'}
                </Text>
              </Card.Content>
            </Card>

            <Card style={styles.statCard}>
              <Card.Content>
                <Text variant="titleSmall" style={styles.statLabel}>
                  Avg Risk Score
                </Text>
                <Text 
                  variant="displaySmall" 
                  style={[styles.statValue, { color: getRiskColor(stats.avgRisk) }]}
                >
                  {stats.avgRisk}%
                </Text>
              </Card.Content>
            </Card>
          </View>

          {/* Total Amount Card */}
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium">Total Processed</Text>
              <Text variant="displayMedium" style={{ color: '#1976D2', marginTop: 10 }}>
                ${stats.totalAmount.toFixed(2)}
              </Text>
            </Card.Content>
          </Card>

          {/* Authentication Methods Breakdown */}
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={{ marginBottom: 15 }}>
                Authentication Methods
              </Text>
              
              <View style={styles.methodRow}>
                <Text>Behavioral Only:</Text>
                <Chip mode="flat" style={{ backgroundColor: '#E8F5E9' }}>
                  {stats.autoApproved} ({stats.totalPayments > 0 
                    ? Math.round((stats.autoApproved / stats.totalPayments) * 100)
                    : 0}%)
                </Chip>
              </View>

              <View style={styles.methodRow}>
                <Text>Behavioral + Biometric:</Text>
                <Chip mode="flat" style={{ backgroundColor: '#FFF3E0' }}>
                  {stats.mfaRequired} ({stats.totalPayments > 0 
                    ? Math.round((stats.mfaRequired / stats.totalPayments) * 100)
                    : 0}%)
                </Chip>
              </View>
            </Card.Content>
          </Card>

          {/* Recent Transactions Table */}
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={{ marginBottom: 15 }}>
                Recent Transactions
              </Text>

              {recentPayments.length === 0 ? (
                <Text style={{ opacity: 0.6, textAlign: 'center', paddingVertical: 20 }}>
                  No transactions yet
                </Text>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <DataTable>
                    <DataTable.Header>
                      <DataTable.Title style={{ width: 100 }}>Date</DataTable.Title>
                      <DataTable.Title style={{ width: 100 }}>Merchant</DataTable.Title>
                      <DataTable.Title numeric style={{ width: 80 }}>Amount</DataTable.Title>
                      <DataTable.Title style={{ width: 80 }}>Risk</DataTable.Title>
                      <DataTable.Title style={{ width: 100 }}>Auth</DataTable.Title>
                      <DataTable.Title style={{ width: 80 }}>TEE</DataTable.Title>
                    </DataTable.Header>

                    {recentPayments.map((payment, index) => (
                      <DataTable.Row key={index}>
                        <DataTable.Cell style={{ width: 100 }}>
                          {new Date(payment.timestamp).toLocaleDateString()}
                        </DataTable.Cell>
                        <DataTable.Cell style={{ width: 100 }}>
                          {payment.merchant}
                        </DataTable.Cell>
                        <DataTable.Cell numeric style={{ width: 80 }}>
                          ${payment.amount}
                        </DataTable.Cell>
                        <DataTable.Cell style={{ width: 80 }}>
                          <Chip
                            mode="flat"
                            style={{
                              backgroundColor: getRiskBgColor(payment.manifest.claim.behavioral.riskScore),
                              height: 28,
                            }}
                            textStyle={{
                              color: getRiskColor(payment.manifest.claim.behavioral.riskScore),
                              fontSize: 11,
                            }}
                          >
                            {payment.manifest.claim.behavioral.riskScore}%
                          </Chip>
                        </DataTable.Cell>
                        <DataTable.Cell style={{ width: 100 }}>
                          {payment.manifest.claim.activeBiometric ? (
                            <Chip mode="flat" style={{ backgroundColor: '#FFF3E0', height: 28 }}>
                              {payment.manifest.claim.activeBiometric.method === 'faceId' && '👤'}
                              {payment.manifest.claim.activeBiometric.method === 'touchId' && '👆'}
                              Bio
                            </Chip>
                          ) : (
                            <Chip mode="flat" style={{ backgroundColor: '#E8F5E9', height: 28 }}>
                              Auto
                            </Chip>
                          )}
                        </DataTable.Cell>
                        <DataTable.Cell style={{ width: 80 }}>
                          {payment.manifest.claim.teeDetails?.hardwareBacked ? '🔒' : '⚠️'}
                        </DataTable.Cell>
                      </DataTable.Row>
                    ))}
                  </DataTable>
                </ScrollView>
              )}
            </Card.Content>
          </Card>

          {/* Risk Distribution */}
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={{ marginBottom: 15 }}>
                Risk Distribution
              </Text>

              {(() => {
                const lowRisk = recentPayments.filter(p => p.manifest.claim.behavioral.riskScore < 40).length;
                const medRisk = recentPayments.filter(p => 
                  p.manifest.claim.behavioral.riskScore >= 40 && 
                  p.manifest.claim.behavioral.riskScore < 70
                ).length;
                const highRisk = recentPayments.filter(p => p.manifest.claim.behavioral.riskScore >= 70).length;

                return (
                  <>
                    <View style={styles.riskRow}>
                      <View style={styles.riskLabel}>
                        <View style={[styles.riskDot, { backgroundColor: '#2E7D32' }]} />
                        <Text>Low Risk (0-40%)</Text>
                      </View>
                      <Text style={{ fontWeight: 'bold' }}>{lowRisk}</Text>
                    </View>

                    <View style={styles.riskRow}>
                      <View style={styles.riskLabel}>
                        <View style={[styles.riskDot, { backgroundColor: '#F57C00' }]} />
                        <Text>Medium Risk (40-70%)</Text>
                      </View>
                      <Text style={{ fontWeight: 'bold' }}>{medRisk}</Text>
                    </View>

                    <View style={styles.riskRow}>
                      <View style={styles.riskLabel}>
                        <View style={[styles.riskDot, { backgroundColor: '#C62828' }]} />
                        <Text>High Risk (70-100%)</Text>
                      </View>
                      <Text style={{ fontWeight: 'bold' }}>{highRisk}</Text>
                    </View>
                  </>
                );
              })()}
            </Card.Content>
          </Card>
        </>
      )}

      {!stats && (
        <Card style={styles.card}>
          <Card.Content>
            <Text style={{ textAlign: 'center', opacity: 0.6 }}>
              Loading dashboard data...
            </Text>
          </Card.Content>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 20,
  },
  title: {
    marginBottom: 20,
    fontWeight: 'bold',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  statCard: {
    width: (screenWidth - 50) / 2,
    marginBottom: 10,
  },
  statLabel: {
    opacity: 0.7,
    marginBottom: 5,
  },
  statValue: {
    fontWeight: 'bold',
  },
  statSubtext: {
    opacity: 0.6,
    marginTop: 5,
  },
  card: {
    marginBottom: 15,
  },
  methodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  riskRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  riskLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  riskDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
});