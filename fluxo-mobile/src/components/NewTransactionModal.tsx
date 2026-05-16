import React, { useState } from 'react';
import { 
  Modal, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { api } from '../services/api';
import { X, ArrowDownCircle, ArrowUpCircle } from 'lucide-react-native';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const NewTransactionModal = ({ visible, onClose, onSuccess }: Props) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!description || !amount) {
      alert('Preencha a descrição e o valor');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        description,
        amount: parseFloat(amount.replace(',', '.')),
        type,
        category: 'Outros', // Default for now
        date: new Date().toISOString().split('T')[0],
        expenseType: type === 'expense' ? 'variable' : null,
        confirmed: true
      };

      await api.post('/transactions', payload);
      setDescription('');
      setAmount('');
      setType('expense');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating transaction:', error);
      alert('Erro ao criar transação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.sheetContainer}
        >
          <View style={styles.sheet}>
            <View style={styles.header}>
              <Text style={styles.title}>Novo Lançamento</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <X color="#94a3b8" size={24} />
              </TouchableOpacity>
            </View>

            <View style={styles.typeSelector}>
              <TouchableOpacity 
                style={[styles.typeBtn, type === 'expense' && styles.typeBtnActiveExpense]}
                onPress={() => setType('expense')}
              >
                <ArrowDownCircle color={type === 'expense' ? '#fff' : '#94a3b8'} size={24} />
                <Text style={[styles.typeText, type === 'expense' && styles.typeTextActive, { marginLeft: 8 }]}>Gasto</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.typeBtn, type === 'income' && styles.typeBtnActiveIncome]}
                onPress={() => setType('income')}
              >
                <ArrowUpCircle color={type === 'income' ? '#fff' : '#94a3b8'} size={24} />
                <Text style={[styles.typeText, type === 'income' && styles.typeTextActive, { marginLeft: 8 }]}>Receita</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Valor (R$)</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0,00"
                placeholderTextColor="#64748b"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Descrição</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Supermercado"
                placeholderTextColor="#64748b"
                value={description}
                onChangeText={setDescription}
              />
            </View>

            <TouchableOpacity 
              style={styles.submitBtn} 
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Salvar</Text>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    width: '100%',
  },
  sheet: {
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  closeBtn: {
    padding: 4,
  },
  typeSelector: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  typeBtnActiveExpense: {
    backgroundColor: '#ef4444',
  },
  typeBtnActiveIncome: {
    backgroundColor: '#10b981',
  },
  typeText: {
    color: '#94a3b8',
    fontWeight: '600',
    fontSize: 16,
  },
  typeTextActive: {
    color: '#fff',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: '#cbd5e1',
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 16,
    color: '#f8fafc',
    fontSize: 16,
  },
  amountInput: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 20,
    color: '#8b5cf6',
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  submitBtn: {
    backgroundColor: '#8b5cf6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  }
});
