import numpy as np
from sklearn.metrics import confusion_matrix, f1_score, precision_score, recall_score


def compute_iou(pred, mask):

    intersection = np.logical_and(pred,mask).sum()
    union = np.logical_or(pred,mask).sum()

    if union == 0:
        return 0

    return intersection/union


def compute_f1(pred, mask):

    pred = pred.flatten()
    mask = mask.flatten()

    return f1_score(mask,pred,average='macro')


def compute_precision(pred,mask):

    pred = pred.flatten()
    mask = mask.flatten()

    return precision_score(mask,pred,average='macro')


def compute_recall(pred,mask):

    pred = pred.flatten()
    mask = mask.flatten()

    return recall_score(mask,pred,average='macro')


def regional_damage_index(pred):

    total_pixels = pred.size

    damage_pixels = np.sum(pred>0)

    rdi = damage_pixels/total_pixels

    return rdi


def get_confusion_matrix(pred,mask):

    return confusion_matrix(mask.flatten(),pred.flatten())